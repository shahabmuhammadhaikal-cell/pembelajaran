/**
 * Alur hapus akun di sisi klien, dipisah dari komponen agar bisa diuji:
 * buktikan identitas dulu, baru minta tiket, dan hanya tiket sah yang
 * dipakai memanggil API hapus. Bila verifikasi gagal, API hapus tidak
 * pernah dipanggil (satu-satunya pemanggilan ada setelah tiket divalidasi).
 */

// Tiket server: 32 byte acak dalam base64url.
const TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/

export async function deleteAccountWithReauth({
  method,
  password = "",
  getToken,
  googleReauthentication,
  requestTicket,
  deleteAccount
}) {
  if (method !== "password" && method !== "google") {
    throw new Error("Metode verifikasi tidak tersedia. Keluar lalu masuk lagi.")
  }

  const token = await getToken()
  if (!token) throw new Error("Sesi login berakhir. Silakan masuk lagi.")

  let proof
  if (method === "password") {
    // Password hanya diteruskan ke server untuk diverifikasi; tidak disimpan.
    if (!String(password).trim()) throw new Error("Masukkan password akun dulu.")
    proof = { method, password }
  } else {
    const result = await googleReauthentication()
    const googleIdToken = result && result.googleIdToken
    if (!googleIdToken) throw new Error("Bukti verifikasi Google tidak tersedia. Penghapusan dibatalkan.")
    proof = { method, googleIdToken }
  }

  // Server menerbitkan tiket hanya setelah identitas terbukti.
  const issued = await requestTicket(token, proof)
  if (!issued || issued.ok === false || typeof issued.ticket !== "string" || !TICKET_PATTERN.test(issued.ticket)) {
    throw new Error("Tiket verifikasi tidak diterima. Penghapusan dibatalkan.")
  }

  return deleteAccount(token, issued.ticket)
}
