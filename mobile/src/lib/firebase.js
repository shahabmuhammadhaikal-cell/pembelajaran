/**
 * Login Firebase Authentication (Email/Password) untuk aplikasi mobile.
 *
 * Memakai REST Identity Toolkit, bukan SDK web `firebase/auth`: SDK itu butuh
 * penyimpanan khusus React Native, sedangkan REST hanya perlu `fetch` +
 * AsyncStorage sehingga berjalan di Expo Go tanpa modul native tambahan.
 * Akun yang dipakai sama dengan aplikasi web (project Firebase yang sama),
 * jadi email/password yang sudah terdaftar di web langsung bisa dipakai.
 */
import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Config web Firebase — nilai di bawah ini memang publik (dipakai frontend web
 * di client/public/app.config.js). Kunci server (FIREBASE_SERVICE_ACCOUNT)
 * tidak pernah ada di aplikasi.
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDVFffqgybE1zE_GVfhP3QWycxgz_IDNDI",
  authDomain: "pembelajaran-90f14.firebaseapp.com",
  projectId: "pembelajaran-90f14",
  storageBucket: "pembelajaran-90f14.firebasestorage.app",
  messagingSenderId: "584399346944",
  appId: "1:584399346944:web:2c21af2603351aff8627e5"
}

function normalizeBase(value) {
  const raw = String(value || "").trim()
  if (!raw) return ""
  return raw.endsWith("/") ? raw : `${raw}/`
}

/** Backend Express (progres akun tersimpan di Firestore lewat server). */
export const API_BASE = normalizeBase(
  process.env.EXPO_PUBLIC_API_BASE || "https://pembelajaran-api.onrender.com/"
)

const IDENTITY = "https://identitytoolkit.googleapis.com/v1/accounts"
const TOKEN_URL = "https://securetoken.googleapis.com/v1/token"
const SESSION_KEY = "pembelajar-mobile-session-v1"
const REFRESH_MARGIN_MS = 60_000

/** Error bertanda `code` seperti error SDK Firebase, agar pesannya bisa dipetakan. */
function authError(message, code = "") {
  const error = new Error(message)
  error.code = String(message || code || "")
  return error
}

async function postJson(url, body) {
  let res
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  } catch {
    throw authError("Jaringan bermasalah. Periksa koneksi lalu coba lagi.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data && data.error && data.error.message) || `HTTP ${res.status}`
    throw authError(message)
  }
  return data
}

function toSession(payload) {
  const expiresIn = Number(payload.expiresIn || payload.expires_in || 3600) || 3600
  return {
    uid: String(payload.localId || payload.user_id || ""),
    email: String(payload.email || ""),
    idToken: String(payload.idToken || payload.id_token || ""),
    refreshToken: String(payload.refreshToken || payload.refresh_token || ""),
    expiresAt: Date.now() + expiresIn * 1000
  }
}

async function storeSession(session) {
  try {
    if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else await AsyncStorage.removeItem(SESSION_KEY)
  } catch {
    /* penyimpanan gagal: sesi tetap berjalan sampai aplikasi ditutup */
  }
}

/** Baca sesi tersimpan; token yang hampir kedaluwarsa disegarkan. */
export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || !saved.idToken || !saved.refreshToken) return null
    return saved
  } catch {
    return null
  }
}

async function refreshSession(session) {
  let res
  try {
    res = await fetch(`${TOKEN_URL}?key=${FIREBASE_CONFIG.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`
    })
  } catch {
    throw authError("Jaringan bermasalah. Periksa koneksi lalu coba lagi.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw authError((data && data.error && data.error.message) || "Sesi login berakhir")
  }
  return toSession({ ...data, localId: data.user_id, idToken: data.id_token })
}

/** Token akses untuk header Authorization; disegarkan otomatis bila perlu. */
export async function idTokenFor(session) {
  if (!session) return ""
  if (session.expiresAt - REFRESH_MARGIN_MS > Date.now() && session.idToken) return session.idToken
  const next = await refreshSession(session)
  const merged = { ...session, ...next, uid: next.uid || session.uid, email: next.email || session.email }
  await storeSession(merged)
  return merged.idToken
}

/** Masuk dengan email + password milik akun Firebase. */
export async function signInEmail(email, password) {
  const data = await postJson(`${IDENTITY}:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`, {
    email: String(email || "").trim(),
    password: String(password || ""),
    returnSecureToken: true
  })
  const session = toSession(data)
  await storeSession(session)
  return session
}

/** Buat akun baru (email/password) di project Firebase yang sama dengan web. */
export async function signUpEmail(email, password) {
  const data = await postJson(`${IDENTITY}:signUp?key=${FIREBASE_CONFIG.apiKey}`, {
    email: String(email || "").trim(),
    password: String(password || ""),
    returnSecureToken: true
  })
  const session = toSession(data)
  await storeSession(session)
  return session
}

/** Kirim email pengaturan ulang password. */
export async function sendPasswordReset(email) {
  await postJson(`${IDENTITY}:sendOobCode?key=${FIREBASE_CONFIG.apiKey}`, {
    requestType: "PASSWORD_RESET",
    email: String(email || "").trim()
  })
}

/** Keluar: hapus sesi di perangkat. Progres lokal tetap disimpan. */
export async function signOutUser() {
  await storeSession(null)
}

const AUTH_MESSAGES = {
  EMAIL_NOT_FOUND: "Email belum terdaftar. Coba tab Buat akun.",
  INVALID_PASSWORD: "Password salah.",
  INVALID_LOGIN_CREDENTIALS: "Email atau password salah.",
  INVALID_EMAIL: "Format email belum benar.",
  MISSING_PASSWORD: "Password belum diisi.",
  MISSING_EMAIL: "Email belum diisi.",
  EMAIL_EXISTS: "Email itu sudah terdaftar. Coba masuk.",
  OPERATION_NOT_ALLOWED:
    "Login Email/Password belum diaktifkan di Firebase Console → Authentication → Sign-in method.",
  API_KEY_INVALID: "Konfigurasi Firebase tidak valid (apiKey).",
  USER_DISABLED: "Akun ini dinonaktifkan.",
  TOO_MANY_ATTEMPTS_TRY_LATER: "Terlalu banyak percobaan. Coba lagi beberapa saat.",
  "auth/network-request-failed": "Jaringan bermasalah. Periksa koneksi lalu coba lagi.",
  auth_required: "Token login tidak ditemukan.",
  auth_invalid: "Sesi login tidak valid atau kedaluwarsa. Silakan masuk lagi.",
  auth_unconfigured:
    "Server belum punya kredensial Firebase (FIREBASE_SERVICE_ACCOUNT), jadi progres belum bisa disimpan."
}

/** Pesan Indonesia untuk kode error Identity Toolkit. */
export function authErrorMessage(error) {
  if (!error) return "Gagal masuk. Coba lagi."
  const raw = String(error.message || "")
  if (AUTH_MESSAGES[raw]) return AUTH_MESSAGES[raw]
  if (/WEAK_PASSWORD/.test(raw)) return "Password minimal 6 karakter."
  if (/PASSWORD_DOES_NOT_MEET_REQUIREMENTS/.test(raw)) return "Password terlalu lemah. Gunakan minimal 6 karakter."
  if (/INVALID_IDP_RESPONSE|INVALID_LOGIN_CREDENTIALS/.test(raw)) return "Email atau password salah."
  if (/API key not valid|API_KEY_INVALID/.test(raw)) return "Konfigurasi Firebase tidak valid (apiKey)."
  return raw || "Gagal masuk. Coba lagi."
}
