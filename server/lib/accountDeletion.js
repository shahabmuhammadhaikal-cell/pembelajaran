/**
 * Alur hapus akun dalam dua langkah yang sengaja dipisah:
 *   1. POST /api/account/deletion-ticket  → buktikan password/Google, terima tiket.
 *   2. DELETE /api/account               → tukar tiket dengan penghapusan data.
 *
 * Aturan yang dijaga modul ini:
 * - Tiket hanya dibuat SETELAH verify* selesai tanpa error, jadi verifikasi
 *   yang gagal tidak pernah bisa berujung pada panggilan hapus.
 * - Tanpa tiket sah, deleteAccount/deleteAuthUser tidak pernah dipanggil.
 * - Tiket sekali pakai: dipakai (dihapus) sebelum data disentuh.
 */

function sendError(res, status, message, code) {
  res.status(status).json(code ? { ok: false, code, error: message } : { ok: false, error: message })
}

function createAccountDeletion({
  tickets,
  verifyPassword,
  verifyGoogleIdToken,
  deleteAccount,
  deleteAuthUser,
  allowAttempt = () => true,
  env = process.env,
  logEvent = () => {}
}) {
  async function requestTicket(req, res) {
    res.set("Cache-Control", "private, no-store")

    const method = String((req.body && req.body.method) || "").trim()
    if (method !== "password" && method !== "google") {
      sendError(res, 400, "Metode verifikasi harus password atau google")
      return
    }

    const user = req.user || {}
    const email = String(user.email || "").trim()
    if (!email) {
      // Tanpa email acuan, bukti tidak bisa diikat ke akun ini: tolak, jangan tebak.
      sendError(res, 400, "Akun ini tidak punya email untuk verifikasi. Masuk ulang lalu coba lagi.")
      return
    }

    // Kuota percobaan hanya dipakai untuk permintaan verifikasi yang sah.
    if (!allowAttempt(user.uid)) {
      res.set("Retry-After", "900")
      sendError(res, 429, "Terlalu banyak percobaan verifikasi. Coba lagi nanti.")
      return
    }

    try {
      if (method === "password") {
        await verifyPassword({
          email,
          password: req.body && req.body.password,
          uid: user.uid,
          apiKey: env.FIREBASE_WEB_API_KEY
        })
      } else {
        await verifyGoogleIdToken({
          idToken: req.body && req.body.googleIdToken,
          email,
          clientId: env.GOOGLE_OAUTH_CLIENT_ID
        })
      }
    } catch (error) {
      logEvent("account_reauth_error", error.code || "unknown")
      if (error.status) {
        sendError(res, error.status, error.message, error.code)
        return
      }
      sendError(res, 500, "Gagal memverifikasi identitas")
      return
    }

    const issued = tickets.issue(user.uid)
    logEvent("account_reauth_ok", `${String(user.uid).slice(0, 8)}:${method}`)
    res.json({ ok: true, ticket: issued.ticket, expires_at: issued.expiresAt })
  }

  async function deleteAccountRoute(req, res) {
    res.set("Cache-Control", "private, no-store")

    const uid = String((req.user && req.user.uid) || "")
    const ticket = String(req.headers["x-deletion-ticket"] || "").trim()
    if (!uid || !tickets.consume(ticket, uid)) {
      sendError(
        res,
        403,
        "Verifikasi ulang identitas diperlukan sebelum menghapus akun.",
        "deletion_ticket_required"
      )
      return
    }

    try {
      await deleteAccount(uid)
      await deleteAuthUser(uid)
    } catch (error) {
      logEvent("account_delete_error", error.message)
      sendError(res, 500, "Gagal menghapus akun")
      return
    }

    logEvent("account_delete_ok", uid.slice(0, 8))
    res.json({ ok: true })
  }

  return { requestTicket, deleteAccount: deleteAccountRoute }
}

module.exports = { createAccountDeletion }
