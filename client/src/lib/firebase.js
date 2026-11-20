/**
 * Firebase Authentication (Email/Password).
 * SDK dimuat malas (dynamic import) supaya bundle utama tetap ringan
 * dan aplikasi tetap jalan walau login belum dikonfigurasi.
 */

function readConfig() {
  if (typeof window === "undefined") return {}
  const config = window.PEMBELAJAR_CONFIG && window.PEMBELAJAR_CONFIG.firebase
  return config && typeof config === "object" ? config : {}
}

export function firebaseConfigured() {
  const config = readConfig()
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

let sdkPromise = null

async function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([import("firebase/app"), import("firebase/auth")]).then(([appMod, authMod]) => ({
      appMod,
      authMod
    }))
  }
  return sdkPromise
}

async function getAuthInstance() {
  if (!firebaseConfigured()) return null
  const { appMod, authMod } = await loadSdk()
  const app = appMod.getApps().length ? appMod.getApps()[0] : appMod.initializeApp(readConfig())
  return authMod.getAuth(app)
}

export async function subscribeAuth(callback) {
  const auth = await getAuthInstance()
  if (!auth) {
    callback(null)
    return () => {}
  }
  const { authMod } = await loadSdk()
  return authMod.onAuthStateChanged(auth, callback)
}

export async function signInEmail(email, password) {
  const auth = await getAuthInstance()
  if (!auth) throw new Error("Login belum dikonfigurasi")
  const { authMod } = await loadSdk()
  return authMod.signInWithEmailAndPassword(auth, String(email || "").trim(), String(password || ""))
}

export async function signUpEmail(email, password) {
  const auth = await getAuthInstance()
  if (!auth) throw new Error("Login belum dikonfigurasi")
  const { authMod } = await loadSdk()
  return authMod.createUserWithEmailAndPassword(auth, String(email || "").trim(), String(password || ""))
}

export async function signOutUser() {
  const auth = await getAuthInstance()
  if (!auth) return
  const { authMod } = await loadSdk()
  await authMod.signOut(auth)
}

export async function sendPasswordReset(email) {
  const auth = await getAuthInstance()
  if (!auth) throw new Error("Login belum dikonfigurasi")
  const { authMod } = await loadSdk()
  return authMod.sendPasswordResetEmail(auth, String(email || "").trim())
}

export async function sendVerificationEmail() {
  const auth = await getAuthInstance()
  if (!auth || !auth.currentUser) throw new Error("Sesi login tidak ditemukan")
  const { authMod } = await loadSdk()
  return authMod.sendEmailVerification(auth.currentUser)
}

export async function refreshCurrentUser() {
  const auth = await getAuthInstance()
  if (!auth || !auth.currentUser) return null
  await auth.currentUser.reload()
  return auth.currentUser
}

export async function signInGoogle() {
  const auth = await getAuthInstance()
  if (!auth) throw new Error("Login belum dikonfigurasi")
  const { authMod } = await loadSdk()
  const provider = new authMod.GoogleAuthProvider()
  return authMod.signInWithPopup(auth, provider)
}

export async function linkGoogle() {
  const auth = await getAuthInstance()
  if (!auth || !auth.currentUser) throw new Error("Sesi login tidak ditemukan")
  const { authMod } = await loadSdk()
  const provider = new authMod.GoogleAuthProvider()
  return authMod.linkWithPopup(auth.currentUser, provider)
}

export async function currentIdToken(forceRefresh = false) {
  const auth = await getAuthInstance()
  if (!auth || !auth.currentUser) return ""
  try {
    return await auth.currentUser.getIdToken(!!forceRefresh)
  } catch {
    return ""
  }
}

/**
 * Popup Google menghasilkan OAuth ID token sebagai bukti identitas.
 * Bukti itu dikirim ke server; token sesi Firebase saja tidak cukup.
 */
export async function reauthenticateWithGoogle() {
  const auth = await getAuthInstance()
  if (!auth || !auth.currentUser) throw new Error("Sesi login tidak ditemukan")
  const { authMod } = await loadSdk()
  const provider = new authMod.GoogleAuthProvider()
  const result = await authMod.reauthenticateWithPopup(auth.currentUser, provider)
  const credential = authMod.GoogleAuthProvider.credentialFromResult(result)
  return {
    user: result.user,
    googleIdToken: credential && credential.idToken ? credential.idToken : ""
  }
}

const AUTH_MESSAGES = {
  "auth/invalid-email": "Format email belum benar.",
  "auth/missing-password": "Password belum diisi.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/email-already-in-use": "Email itu sudah terdaftar. Coba tab Masuk.",
  "auth/invalid-credential": "Email atau password salah.",
  "auth/wrong-password": "Password salah.",
  "auth/user-not-found": "Email belum terdaftar.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
  "auth/network-request-failed": "Jaringan bermasalah. Periksa koneksi lalu coba lagi.",
  "auth/operation-not-allowed": "Login Email/Password belum diaktifkan di Firebase Console.",
  "auth/configuration-not-found":
    "Login belum aktif untuk project Firebase ini. Aktifkan provider Email/Password dan Google di Firebase Console → Authentication → Sign-in method.",
  "auth/invalid-api-key": "Konfigurasi Firebase tidak valid (apiKey). Periksa client/public/app.config.js.",
  "auth/internal-error": "Firebase menolak permintaan karena konfigurasi project belum lengkap. Periksa Authentication di Firebase Console.",
  "auth/unauthorized-domain": "Domain ini belum diizinkan di Firebase Authentication → Settings → Authorized domains.",
  "auth/account-exists-with-different-credential":
    "Email ini sudah memakai metode login lain. Masuk dengan metode itu dulu, lalu hubungkan Google dari halaman akun.",
  "auth/popup-closed-by-user": "Jendela login Google ditutup sebelum selesai.",
  "auth/popup-blocked": "Jendela login Google diblokir browser. Izinkan pop-up lalu coba lagi.",
  "auth/cancelled-popup-request": "Login Google dibatalkan.",
  "auth/credential-already-in-use": "Akun Google itu sudah terhubung ke akun lain.",
  "auth/provider-already-linked": "Akun Google sudah terhubung.",
  "auth/requires-recent-login": "Silakan keluar lalu masuk lagi sebelum melakukan aksi ini.",
  "auth/user-mismatch": "Akun yang dipakai untuk verifikasi berbeda dengan akun yang sedang masuk.",
  "reauth_unconfigured": "Verifikasi password belum diaktifkan di server (FIREBASE_WEB_API_KEY).",
  "google_reauth_unconfigured": "Verifikasi Google belum diaktifkan di server (GOOGLE_OAUTH_CLIENT_ID).",
  "reauth_unavailable": "Layanan verifikasi sedang tidak bisa dihubungi. Coba lagi.",
  "reauth_failed": "Verifikasi gagal. Penghapusan akun dibatalkan.",
  "deletion_ticket_required": "Verifikasi ulang identitas diperlukan sebelum menghapus akun."
}

export function authErrorMessage(error) {
  if (!error) return "Gagal masuk. Coba lagi."
  if (AUTH_MESSAGES[error.code]) return AUTH_MESSAGES[error.code]
  return error.message || "Gagal masuk. Coba lagi."
}
