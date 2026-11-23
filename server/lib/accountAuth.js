/**
 * Verifikasi login pengguna (Firebase Authentication) memakai firebase-admin.
 * Token dikirim frontend sebagai header `Authorization: Bearer <idToken>`.
 */
const { isFirestoreConfigured, ensureAdmin } = require("../db/firestore")

function authConfigured(env = process.env) {
  return isFirestoreConfigured(env)
}

function getAuth(env = process.env) {
  if (!authConfigured(env)) return null
  return ensureAdmin(env).auth()
}

function requireUser(env = process.env) {
  return async function accountGuard(req, res, next) {
    const header = String(req.headers.authorization || "")
    const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
    const auth = getAuth(env)

    if (!auth) {
      res.status(503).json({
        ok: false,
        code: "auth_unconfigured",
        error: "Login belum dikonfigurasi di server. Isi FIREBASE_SERVICE_ACCOUNT."
      })
      return
    }
    if (!token) {
      res.status(401).json({ ok: false, code: "auth_required", error: "Token login tidak ditemukan" })
      return
    }

    try {
      const decoded = await auth.verifyIdToken(token)
      req.user = { uid: decoded.uid, email: decoded.email || "" }
      next()
    } catch {
      res.status(401).json({
        ok: false,
        code: "auth_invalid",
        error: "Sesi login tidak valid atau kedaluwarsa. Silakan masuk lagi."
      })
    }
  }
}

/** Verifikasi token login dan kembalikan identitas user, atau null. */
async function userFromToken(token, env = process.env) {
  const value = String(token || "").trim()
  if (!value) return null
  const auth = getAuth(env)
  if (!auth) return null
  try {
    const decoded = await auth.verifyIdToken(value)
    return { uid: decoded.uid, email: decoded.email || "" }
  } catch {
    return null
  }
}

async function deleteAuthUser(uid) {
  const auth = getAuth()
  if (!auth) {
    const error = new Error("Login belum dikonfigurasi di server")
    error.code = "auth_unconfigured"
    throw error
  }
  try {
    await auth.deleteUser(uid)
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error
  }
}

module.exports = { requireUser, authConfigured, deleteAuthUser, userFromToken, getAuth }
