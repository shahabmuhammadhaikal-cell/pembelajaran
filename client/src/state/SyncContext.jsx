import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "./AuthContext.jsx"
import { fetchAccountProgress, saveAccountProgress } from "../lib/accountApi.js"
import { currentIdToken, signOutUser } from "../lib/firebase.js"
import { currentAccountOwner, markAccountSynced } from "../lib/accountOwner.js"

export const SyncContext = createContext(null)

const EMPTY_SESSION = {
  uid: "",
  ready: false,
  switched: false,
  firstLogin: false,
  account: null,
  stats: null,
  family: null,
  version: 0
}
const SESSION_EXPIRED = "Sesi login berakhir. Silakan masuk lagi."
const SAVE_DEBOUNCE_MS = 2000
const RETRY_GAP_MS = 15000
const REFRESH_GAP_MS = 60000

function isAuthExpired(err) {
  return !!err && (err.code === "auth_invalid" || err.code === "auth_required")
}

/**
 * Satu-satunya tempat yang berbicara dengan /api/account/progress.
 *
 * Urutan per login: ambil data akun (pull) -> tandai pemilik data lokal -> baru
 * boleh mengirim perubahan (push). Selama pull belum berhasil, tidak ada data
 * yang dikirim, supaya progres akun tidak tertimpa data perangkat yang belum
 * tentu milik akun itu. Perubahan yang tertunda dikirim setelah pull berhasil.
 */
export function SyncProvider({ children }) {
  const { user } = useAuth()
  const uid = user ? user.uid : ""

  const [status, setStatus] = useState("idle") // idle | loading | saving | saved | offline | error
  const [lastSaved, setLastSaved] = useState(0)
  const [error, setError] = useState("")
  const [session, setSession] = useState(EMPTY_SESSION)

  const uidRef = useRef("")
  const sessionRef = useRef(EMPTY_SESSION)
  const versionRef = useRef(0)
  const pending = useRef(null)
  const timer = useRef(null)
  const sending = useRef(false)
  const loading = useRef(false)
  const refreshing = useRef(false)
  const lastAttempt = useRef(0)
  const scheduleRef = useRef(null)
  const loadRef = useRef(() => {})
  // Alasan terakhir gagal menyambung/menyimpan, agar pemanggil flushNow bisa
  // menampilkan penyebab aslinya (mis. server akun belum dikonfigurasi).
  const lastError = useRef("")

  uidRef.current = uid
  sessionRef.current = session

  const noteError = useCallback(message => {
    lastError.current = message
    setError(message)
  }, [])

  const flush = useCallback(async () => {
    // Tunggu pengiriman yang sedang berjalan supaya tidak ada perubahan yang hilang.
    if (sending.current) {
      for (let i = 0; i < 40 && sending.current; i += 1) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      if (sending.current) {
        scheduleRef.current()
        return { ok: false, error: "Penyimpanan sebelumnya belum selesai. Coba lagi sebentar." }
      }
    }
    const payload = pending.current
    if (!payload) return { ok: true }
    if (!uidRef.current) return { ok: false, error: SESSION_EXPIRED }
    if (!sessionRef.current.ready) {
      return {
        ok: false,
        error: lastError.current || "Belum tersambung ke server. Periksa koneksi lalu coba lagi."
      }
    }
    const runUid = uidRef.current
    pending.current = null
    sending.current = true
    setStatus("saving")
    try {
      const token = await currentIdToken()
      if (!token) throw new Error(SESSION_EXPIRED)
      const saved = await saveAccountProgress(token, payload)
      // Akun berganti saat permintaan berjalan: jangan sentuh status sesi baru.
      if (uidRef.current !== runUid) return { ok: true }
      // Metadata akun (profil, role, statistik) ikut diperbarui tanpa menarik ulang
      // seluruh progres, supaya antrean yang belum terkirim tidak terganggu.
      setSession(previous =>
        previous.ready && previous.uid === runUid
          ? {
              ...previous,
              account: saved && saved.account ? saved.account : previous.account,
              stats: saved && saved.stats ? saved.stats : previous.stats
            }
          : previous
      )
      noteError("")
      if (pending.current) {
        // Ada perubahan baru selama menyimpan: jangan bilang "Tersimpan" dulu.
        setStatus("saving")
        scheduleRef.current()
      } else {
        setStatus("saved")
        setLastSaved(Date.now())
      }
      return { ok: true }
    } catch (err) {
      // Hasil ini milik akun sebelumnya, bukan akun yang sekarang terbuka.
      if (uidRef.current !== runUid) return { ok: true }
      if (isAuthExpired(err)) signOutUser().catch(() => {})
      // Jangan buang perubahan: kembalikan ke antrean, dicoba lagi nanti.
      pending.current = { ...payload, ...(pending.current || {}) }
      setStatus("error")
      const message = err && err.message ? err.message : "Gagal menyimpan ke akun"
      noteError(message)
      return { ok: false, error: message }
    } finally {
      // Penggantian akun sudah mereset penanda ini; jangan ganggu kiriman akun baru.
      if (uidRef.current === runUid) sending.current = false
    }
  }, [noteError])

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      flush()
    }, SAVE_DEBOUNCE_MS)
  }, [flush])
  scheduleRef.current = schedule

  const queue = useCallback(
    patch => {
      if (!uidRef.current) return
      pending.current = { ...(pending.current || {}), ...(patch || {}) }
      if (!sessionRef.current.ready) {
        // Server belum terjangkau (mis. offline saat login): coba sambung lagi
        // paling sering sekali per 15 detik, lalu kirim antrean.
        if (Date.now() - lastAttempt.current > RETRY_GAP_MS) loadRef.current()
        return
      }
      setStatus("saving")
      schedule()
    },
    [schedule]
  )

  const retry = useCallback(() => {
    // Sudah punya data akun: kirim antrean sekarang, jangan tarik ulang (bisa
    // menimpa perubahan yang belum sempat tersimpan).
    if (sessionRef.current.ready) {
      if (pending.current) {
        setStatus("saving")
        flush()
      }
      return
    }
    lastAttempt.current = 0
    loadRef.current()
  }, [flush])

  /** Tarik data terbaru tanpa mengganggu antrean yang belum terkirim. */
  const refresh = useCallback(async () => {
    const runUid = uidRef.current
    if (!runUid || !sessionRef.current.ready) return false
    if (refreshing.current || sending.current || loading.current || pending.current) return false
    refreshing.current = true
    try {
      const token = await currentIdToken()
      if (!token) {
        signOutUser().catch(() => {})
        return false
      }
      const data = await fetchAccountProgress(token)
      if (uidRef.current !== runUid) return false
      versionRef.current += 1
      setSession({
        uid: runUid,
        ready: true,
        switched: false,
        firstLogin: false,
        account: data.account || null,
        stats: data.stats || null,
        family: data.family || null,
        version: versionRef.current
      })
      return true
    } catch (err) {
      if (isAuthExpired(err)) signOutUser().catch(() => {})
      return false
    } finally {
      refreshing.current = false
    }
  }, [])

  // Segarkan saat tab kembali aktif agar progres dari perangkat lain terlihat.
  useEffect(() => {
    if (!uid || !session.ready) return undefined
    let lastRun = Date.now()
    const maybeRefresh = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return
      const now = Date.now()
      if (now - lastRun < REFRESH_GAP_MS) return
      lastRun = now
      refresh()
    }
    window.addEventListener("focus", maybeRefresh)
    document.addEventListener("visibilitychange", maybeRefresh)
    return () => {
      window.removeEventListener("focus", maybeRefresh)
      document.removeEventListener("visibilitychange", maybeRefresh)
    }
  }, [uid, session.ready, refresh])

  // Ganti pengguna: bersihkan antrean lalu ambil datanya sekali.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current = null
    sending.current = false
    loading.current = false
    lastAttempt.current = 0
    setLastSaved(0)
    noteError("")

    if (!uid) {
      setSession(EMPTY_SESSION)
      setStatus("idle")
      return undefined
    }

    let alive = true
    const owner = currentAccountOwner()
    const switched = Boolean(owner) && owner !== uid
    const firstLogin = !owner
    setSession({ ...EMPTY_SESSION, uid, switched, firstLogin })
    setStatus("loading")

    const load = async () => {
      if (!alive || uidRef.current !== uid || loading.current) return
      loading.current = true
      lastAttempt.current = Date.now()
      setStatus("loading")
      try {
        const token = await currentIdToken()
        if (!token) throw new Error(SESSION_EXPIRED)
        const data = await fetchAccountProgress(token)
        if (!alive || uidRef.current !== uid) return
        markAccountSynced(uid)
        versionRef.current += 1
        setSession({
          uid,
          ready: true,
          switched,
          firstLogin,
          account: data.account || null,
          stats: data.stats || null,
          family: data.family || null,
          version: versionRef.current
        })
        setError("")
        if (pending.current) {
          // Masih ada perubahan yang menunggu dikirim: jangan tampil "Tersimpan" dulu.
          setStatus("saving")
          scheduleRef.current()
        } else {
          setStatus("idle")
        }
      } catch (err) {
        if (!alive || uidRef.current !== uid) return
        if (isAuthExpired(err)) signOutUser().catch(() => {})
        setSession({ uid, ready: false, switched, firstLogin, account: null, stats: null, family: null, version: 0 })
        setStatus("offline")
        noteError(err && err.message ? err.message : "Tidak bisa menyambung ke server")
      } finally {
        loading.current = false
      }
    }

    loadRef.current = load
    load()

    return () => {
      alive = false
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      loadRef.current = () => {}
    }
  }, [uid, noteError])

  const value = useMemo(
    () => ({ status, lastSaved, error, session, queue, flushNow: flush, retry, refresh }),
    [status, lastSaved, error, session, queue, flush, retry, refresh]
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) throw new Error("useSync harus dipakai di dalam SyncProvider")
  return context
}
