/**
 * Verifikasi ulang identitas untuk aksi sensitif (hapus akun).
 *
 * Bukti yang diterima server:
 * - password akun, diverifikasi langsung ke Firebase Identity Toolkit; atau
 * - Google OAuth ID token hasil popup reautentikasi, diverifikasi ke Google.
 *
 * Token sesi Firebase saja tidak cukup: token yang baru dicuri tetap tidak
 * bisa menghasilkan bukti di atas tanpa password atau interaksi Google.
 */

const IDENTITY_TOOLKIT_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"])
const FETCH_TIMEOUT_MS = 12_000

function reauthError(message, code, status = 401) {
  const error = new Error(message)
  error.code = code
  error.status = status
  return error
}

async function fetchJson(url, options, fetchImpl = fetch) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw reauthError("Layanan verifikasi tidak merespons", "reauth_unavailable", 503)
    }
    throw reauthError("Tidak bisa menghubungi layanan verifikasi", "reauth_unavailable", 503)
  } finally {
    clearTimeout(timer)
  }
}

async function verifyPassword({ email, password, uid, apiKey, fetchImpl = fetch }) {
  if (!apiKey) {
    throw reauthError(
      "Verifikasi password server belum dikonfigurasi (FIREBASE_WEB_API_KEY)",
      "reauth_unconfigured",
      503
    )
  }
  const address = String(email || "").trim()
  if (!address) {
    throw reauthError("Akun tidak punya email untuk verifikasi", "reauth_failed", 400)
  }
  const value = String(password || "")
  if (!value) throw reauthError("Password wajib diisi", "reauth_failed", 400)
  if (value.length > 256) throw reauthError("Password tidak valid", "reauth_failed", 400)

  const url = `${IDENTITY_TOOLKIT_URL}?key=${encodeURIComponent(apiKey)}`
  const { response, data } = await fetchJson(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address, password: value, returnSecureToken: false })
    },
    fetchImpl
  )

  if (!response.ok || !data || data.localId !== uid) {
    const providerCode = String(data && data.error && data.error.message || "")
    if (providerCode === "TOO_MANY_ATTEMPTS_TRY_LATER") {
      throw reauthError(
        "Terlalu banyak percobaan password. Coba lagi nanti.",
        "reauth_rate_limited",
        429
      )
    }
    if (["API_KEY_INVALID", "API_KEY_SERVICE_BLOCKED", "API_KEY_HTTP_REFERRER_BLOCKED", "API_KEY_ANDROID_APP_BLOCKED", "API_KEY_IOS_APP_BLOCKED", "OPERATION_NOT_ALLOWED"].includes(providerCode)) {
      throw reauthError(
        "Verifikasi password server tidak tersedia. Periksa FIREBASE_WEB_API_KEY.",
        "reauth_unconfigured",
        503
      )
    }
    // Pesan sengaja generik agar tidak membocorkan status akun.
    throw reauthError("Password salah. Penghapusan dibatalkan.", "reauth_failed", 401)
  }
  return true
}

function validateGoogleProfile(profile, { email, clientId, now = Date.now() } = {}) {
  if (!profile || !clientId) return false
  const address = String(email || "").trim()
  if (!address) return false
  if (String(profile.aud || "") !== String(clientId)) return false
  if (!GOOGLE_ISSUERS.has(String(profile.iss || ""))) return false
  if (!Number.isFinite(Number(profile.exp)) || Number(profile.exp) * 1000 <= now) return false
  const profileEmail = String(profile.email || "").trim()
  if (!profileEmail || profileEmail.toLowerCase() !== address.toLowerCase()) return false
  return profile.email_verified === true || profile.email_verified === "true"
}

async function verifyGoogleIdToken({ idToken, email, clientId, fetchImpl = fetch }) {
  if (!clientId) {
    throw reauthError(
      "Verifikasi Google server belum dikonfigurasi (GOOGLE_OAUTH_CLIENT_ID)",
      "google_reauth_unconfigured",
      503
    )
  }
  const token = String(idToken || "")
  if (!token) throw reauthError("Bukti verifikasi Google tidak ditemukan", "reauth_failed", 400)
  if (token.length > 6000) throw reauthError("Bukti verifikasi Google tidak valid", "reauth_failed", 400)

  // POST agar ID token tidak masuk ke URL/log proxy. Tokeninfo memvalidasi signature,
  // audience, issuer, dan masa berlaku di sisi Google.
  const { response, data } = await fetchJson(
    GOOGLE_TOKENINFO_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id_token=${encodeURIComponent(token)}`
    },
    fetchImpl
  )
  if (!response.ok || !validateGoogleProfile(data, { email, clientId })) {
    throw reauthError("Verifikasi Google gagal. Penghapusan dibatalkan.", "reauth_failed", 401)
  }
  return true
}

module.exports = {
  verifyPassword,
  verifyGoogleIdToken,
  validateGoogleProfile
}
