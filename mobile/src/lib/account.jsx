import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  authErrorMessage,
  idTokenFor,
  loadSession,
  sendPasswordReset,
  signInEmail,
  signOutUser,
  signUpEmail
} from "./firebase"
import { fetchAccount, saveAccountKids } from "./accountApi"
import { useKids } from "./progress"

const AccountContext = createContext(null)
const PUSH_DELAY_MS = 1500

const num = value => (Number.isFinite(Number(value)) ? Number(value) : 0)

function mergeMaps(local, remote) {
  return { ...(remote || {}), ...(local || {}) }
}

/**
 * Gabungkan progres lokal dengan progres akun: bintang & rekor pakai nilai
 * terbesar, daftar disatukan. Sama arahnya dengan penggabungan di server,
 * jadi tidak ada data yang hilang saat dua perangkat bergantian memakai akun.
 */
export function mergeKids(local, remote) {
  if (!remote || typeof remote !== "object") return local
  const base = local || {}
  const best = { ...(base.best || {}) }
  for (const [key, value] of Object.entries(remote.best || {})) {
    best[key] = Math.max(num(best[key]), num(value))
  }
  return {
    ...base,
    stars: Math.max(num(base.stars), num(remote.stars)),
    learned: mergeMaps(base.learned, remote.learned),
    topicsDone: mergeMaps(base.topicsDone, remote.topicsDone),
    stickers: mergeMaps(base.stickers, remote.stickers),
    stories: mergeMaps(base.stories, remote.stories),
    best,
    // Kata sulit hanya tersimpan di perangkat (tidak dikirim ke server).
    mistakes: { ...(base.mistakes || {}), ...(remote.mistakes || {}) },
    lastTopic: base.lastTopic || remote.lastTopic || "",
    settings: { ...(remote.settings || {}), ...(base.settings || {}) }
  }
}

/** Dokumen `kids` server bisa berbentuk {active, profiles} atau profil tunggal. */
export function kidsProfileOf(payload) {
  const kids = payload && payload.account && payload.account.kids
  if (!kids || typeof kids !== "object") return null
  if (kids.profiles && typeof kids.profiles === "object") {
    const active = kids.profiles[kids.active] || kids.profiles[Object.keys(kids.profiles)[0]]
    return active && typeof active === "object" ? active : null
  }
  return kids
}

export function AccountProvider({ children }) {
  const { kids, actions } = useKids()
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("idle") // idle | syncing | synced | offline
  const [lastSync, setLastSync] = useState(0)

  const kidsRef = useRef(kids)
  kidsRef.current = kids
  const timer = useRef(null)
  const pushing = useRef(false)

  /** Ambil progres akun lalu gabungkan ke progres lokal. */
  const hydrate = useCallback(
    async activeSession => {
      setStatus("syncing")
      setError("")
      try {
        const token = await idTokenFor(activeSession)
        const data = await fetchAccount(token)
        const remote = kidsProfileOf(data)
        if (remote) actions.replace(mergeKids(kidsRef.current, remote))
        setStatus("synced")
        setLastSync(Date.now())
        setHydrated(true)
      } catch (failure) {
        setHydrated(true)
        setStatus("offline")
        setError(failure.offline ? "" : authErrorMessage(failure))
      }
    },
    [actions]
  )

  // Pulihkan sesi yang tersimpan saat aplikasi dibuka.
  useEffect(() => {
    let cancelled = false
    loadSession()
      .then(async saved => {
        if (cancelled) return
        if (!saved) {
          setReady(true)
          return
        }
        setSession(saved)
        setReady(true)
        await hydrate(saved)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const push = useCallback(async activeSession => {
    if (pushing.current) return
    pushing.current = true
    setStatus("syncing")
    try {
      const token = await idTokenFor(activeSession)
      await saveAccountKids(token, kidsRef.current)
      setStatus("synced")
      setLastSync(Date.now())
      setError("")
    } catch (failure) {
      setStatus("offline")
      if (!failure.offline) setError(authErrorMessage(failure))
    } finally {
      pushing.current = false
    }
  }, [])

  // Kirim perubahan progres ke akun (dengan jeda agar tidak membanjiri server).
  useEffect(() => {
    if (!session || !hydrated) return undefined
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => push(session), PUSH_DELAY_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [kids, session, hydrated, push])

  const login = useCallback(
    async (email, password) => {
      setBusy(true)
      setError("")
      setHydrated(false)
      try {
        const next = await signInEmail(email, password)
        if (timer.current) clearTimeout(timer.current)
        setSession(next)
        await hydrate(next)
        return true
      } catch (failure) {
        setError(authErrorMessage(failure))
        return false
      } finally {
        setBusy(false)
      }
    },
    [hydrate]
  )

  const register = useCallback(
    async (email, password) => {
      setBusy(true)
      setError("")
      setHydrated(false)
      try {
        const next = await signUpEmail(email, password)
        if (timer.current) clearTimeout(timer.current)
        setSession(next)
        await hydrate(next)
        return true
      } catch (failure) {
        setError(authErrorMessage(failure))
        return false
      } finally {
        setBusy(false)
      }
    },
    [hydrate]
  )

  const resetPassword = useCallback(async email => {
    setError("")
    try {
      await sendPasswordReset(email)
      return true
    } catch (failure) {
      setError(authErrorMessage(failure))
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    await signOutUser()
    setSession(null)
    setHydrated(false)
    setStatus("idle")
    setLastSync(0)
    setError("")
  }, [])

  const value = useMemo(
    () => ({
      session,
      ready,
      busy,
      error,
      status,
      lastSync,
      login,
      register,
      resetPassword,
      logout,
      syncNow: () => (session ? push(session) : Promise.resolve())
    }),
    [session, ready, busy, error, status, lastSync, login, register, resetPassword, logout, push]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const value = useContext(AccountContext)
  if (!value) throw new Error("useAccount harus dipakai di dalam AccountProvider")
  return value
}
