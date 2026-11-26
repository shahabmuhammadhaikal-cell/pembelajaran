import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Platform } from "react-native"
import * as Google from "expo-auth-session/providers/google"
import {
  GOOGLE_CLIENT_IDS,
  authErrorMessage,
  idTokenFor,
  loadSession,
  sendPasswordReset,
  signInEmail,
  signInWithGoogleIdToken,
  signOutUser,
  signUpEmail
} from "./firebase"
import { fetchAccount, saveAccountKids } from "./accountApi"
import { MISTAKE_LIMIT, useKids } from "./progress"

const AccountContext = createContext(null)
const PUSH_DELAY_MS = 1500

const GOOGLE_MESSAGES = {
  access_denied: "Login Google dibatalkan.",
  redirect_uri_mismatch:
    "Redirect aplikasi ini belum diizinkan di Google Cloud Console (OAuth client project Firebase).",
  invalid_request:
    "Konfigurasi OAuth Google belum lengkap: client ID atau redirect URI belum terdaftar.",
  popup_closed_by_user: "Jendela login Google ditutup sebelum selesai.",
  idpiframe_initialization_failed:
    "Browser memblokir login Google (cookie pihak ketiga). Izinkan cookie lalu coba lagi."
}

/** Client ID Google yang tersedia untuk platform aktif. */
function googleClientForPlatform() {
  if (Platform.OS === "ios") return GOOGLE_CLIENT_IDS.ios
  if (Platform.OS === "android") return GOOGLE_CLIENT_IDS.android
  return GOOGLE_CLIENT_IDS.web
}

/** Redirect custom scheme wajib mengikuti client ID Android/iOS Google. */
function googleRedirectUri() {
  if (Platform.OS === "web") return undefined
  const clientId = googleClientForPlatform()
  const prefix = String(clientId || "").replace(/\.apps\.googleusercontent\.com$/, "")
  return prefix ? `com.googleusercontent.apps.${prefix}:/oauth2redirect` : undefined
}

function googleErrorMessage(response) {
  if (!response) return "Login Google gagal. Coba lagi."
  const code =
    (response.params && (response.params.error || response.params.error_description)) ||
    (response.error && (response.error.code || response.error.message)) ||
    response.error ||
    ""
  const key = String(code || "")
  if (GOOGLE_MESSAGES[key]) return GOOGLE_MESSAGES[key]
  if (/popup|window|block/i.test(key)) return "Jendela login Google diblokir. Izinkan pop-up lalu coba lagi."
  return key || "Login Google gagal. Coba lagi."
}

const num = value => (Number.isFinite(Number(value)) ? Number(value) : 0)

function mergeMaps(local, remote) {
  return { ...(remote || {}), ...(local || {}) }
}

function mistakeEntry(value) {
  const source = value && typeof value === "object" ? value : {}
  return { count: Math.max(1, Math.round(num(source.count)) || 1), at: num(source.at) }
}

/** Kata sulit: jumlah salah & waktu terakhir pakai nilai terbesar per kata. */
export function mergeMistakes(local, remote) {
  const out = {}
  for (const [signature, value] of Object.entries(remote || {})) {
    if (value) out[signature] = mistakeEntry(value)
  }
  for (const [signature, value] of Object.entries(local || {})) {
    if (!value) continue
    const entry = mistakeEntry(value)
    const previous = out[signature]
    out[signature] = previous
      ? { count: Math.max(previous.count, entry.count), at: Math.max(previous.at, entry.at) }
      : entry
  }
  const signatures = Object.keys(out)
  if (signatures.length > MISTAKE_LIMIT) {
    signatures
      .sort((a, b) => out[a].at - out[b].at)
      .slice(0, signatures.length - MISTAKE_LIMIT)
      .forEach(old => delete out[old])
  }
  return out
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
    mistakes: mergeMistakes(base.mistakes, remote.mistakes),
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

  const googleReady = Boolean(googleClientForPlatform())
  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest(
    {
      webClientId: GOOGLE_CLIENT_IDS.web,
      iosClientId: GOOGLE_CLIENT_IDS.ios || undefined,
      androidClientId: GOOGLE_CLIENT_IDS.android || undefined,
      // Cadangan agar hook tidak gagal saat client platform belum diisi.
      clientId: GOOGLE_CLIENT_IDS.web,
      redirectUri: googleRedirectUri(),
      scopes: ["openid", "email", "profile"]
    },
    { scheme: "pembelajar", path: "oauth" }
  )

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

  /** Selesaikan login Google: token Google ditukar jadi sesi Firebase. */
  const completeGoogle = useCallback(
    async idToken => {
      setBusy(true)
      setError("")
      setHydrated(false)
      try {
        const next = await signInWithGoogleIdToken(idToken)
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

  // Buka jendela Google, lalu tangani hasilnya saat respons tiba.
  const loginWithGoogle = useCallback(async () => {
    setError("")
    if (!googleReady) {
      setError(
        "Masuk dengan Google di perangkat ini belum diatur. Isi client ID Google Android/iOS pada build, atau pakai email dan password."
      )
      return false
    }
    if (!googleRequest) {
      setError("Menyiapkan login Google… tunggu sebentar lalu coba lagi.")
      return false
    }
    setBusy(true)
    try {
      const result = await promptGoogle()
      if (!result || result.type !== "success") setBusy(false)
    } catch {
      setBusy(false)
      setError("Tidak bisa membuka jendela login Google. Coba lagi.")
    }
    return true
  }, [googleReady, googleRequest, promptGoogle])

  useEffect(() => {
    if (!googleResponse) return
    if (googleResponse.type === "success") {
      const params = googleResponse.params || {}
      const authentication = googleResponse.authentication || {}
      const idToken = params.id_token || authentication.idToken || ""
      if (idToken) completeGoogle(idToken)
      else {
        setBusy(false)
        setError("Google tidak mengirim ID token. Coba lagi.")
      }
      return
    }
    setBusy(false)
    if (googleResponse.type === "error") setError(googleErrorMessage(googleResponse))
    // `dismiss`: pengguna menutup jendela, tidak perlu pesan.
  }, [googleResponse, completeGoogle])

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
      loginWithGoogle,
      googleReady,
      resetPassword,
      logout,
      syncNow: () => (session ? push(session) : Promise.resolve())
    }),
    [
      session,
      ready,
      busy,
      error,
      status,
      lastSync,
      login,
      register,
      loginWithGoogle,
      googleReady,
      resetPassword,
      logout,
      push
    ]
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const value = useContext(AccountContext)
  if (!value) throw new Error("useAccount harus dipakai di dalam AccountProvider")
  return value
}
