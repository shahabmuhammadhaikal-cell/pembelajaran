/**
 * Pengikat progres lokal ke akun pemiliknya.
 *
 * Aturan: progres yang tersimpan di perangkat (bintang/stiker/cerita mode anak,
 * SRS & favorit dewasa) hanya boleh digabung ke akun yang sama.
 *
 * - Belum pernah login (belum ada pemilik) -> progres lokal digabung ke akun pertama.
 * - Pemilik sama (login ulang akun yang sama) -> digabung, aman.
 * - Pemilik berbeda di perangkat yang sama   -> progres lokal akun sebelumnya dibuang,
 *   yang dipakai hanya data akun yang sedang masuk.
 * - Keluar (logout) -> data lokal akun itu dilepas, sehingga tidak terbawa ke akun lain.
 */
const KEY = "pembelajar_account_uid"

function readOwner() {
  try {
    return localStorage.getItem(KEY) || ""
  } catch {
    return ""
  }
}

/** UID pemilik data lokal saat ini (kosong bila belum pernah login). */
export function currentAccountOwner() {
  return readOwner()
}

/**
 * Apakah akun `uid` berbeda dengan pemilik data lokal saat ini?
 * Dipanggil sekali per login oleh SyncProvider, sebelum data akun diambil.
 */
export function accountSwitchFor(uid) {
  const key = String(uid || "")
  if (!key) return false
  const previous = readOwner()
  return Boolean(previous) && previous !== key
}

/** Panggil setelah progres akun berhasil diambil: uid ini kini pemilik data lokal. */
export function markAccountSynced(uid) {
  const key = String(uid || "")
  if (!key) return
  try {
    localStorage.setItem(KEY, key)
  } catch {
    /* localStorage penuh/diblokir: abaikan */
  }
}

/** Logout: lepas kepemilikan data lokal agar login berikutnya mulai bersih. */
export function resetAccountSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}
