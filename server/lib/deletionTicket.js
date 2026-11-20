/**
 * Tiket hapus akun: bukti bahwa server sudah memverifikasi identitas.
 *
 * - Hanya hash tiket yang disimpan di memori.
 * - Terikat ke uid, sekali pakai, dan kedaluwarsa singkat.
 * - Tiket hilang saat server restart; pengguna tinggal verifikasi ulang.
 */

const crypto = require("crypto")

function createDeletionTickets({ ttlMs = 2 * 60 * 1000, now = () => Date.now(), max = 5000 } = {}) {
  const tickets = new Map()

  const hash = value => crypto.createHash("sha256").update(String(value)).digest("hex")

  function cleanup() {
    const time = now()
    for (const [key, item] of tickets.entries()) {
      if (item.expiresAt <= time) tickets.delete(key)
    }
    if (tickets.size > max) {
      for (const key of tickets.keys()) {
        if (tickets.size <= max) break
        tickets.delete(key)
      }
    }
  }

  function issue(uid) {
    cleanup()
    const ticket = crypto.randomBytes(32).toString("base64url")
    const expiresAt = now() + ttlMs
    tickets.set(hash(ticket), { uid: String(uid), expiresAt })
    return { ticket, expiresAt }
  }

  function consume(ticket, uid) {
    cleanup()
    const key = hash(ticket || "")
    const item = tickets.get(key)
    if (!item) return false
    // Tiket milik uid lain tidak dipakai dan tidak dihapus (bukan wewenangnya).
    if (item.uid !== String(uid)) return false
    tickets.delete(key)
    return item.expiresAt > now()
  }

  return { issue, consume, size: () => tickets.size }
}

module.exports = { createDeletionTickets }
