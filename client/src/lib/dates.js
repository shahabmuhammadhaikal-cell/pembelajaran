/**
 * Tanggal kalender lokal.
 *
 * Misi harian dan streak harus berganti pada tengah malam waktu pengguna,
 * bukan pada tengah malam UTC (yang di WIB berarti pukul 07.00).
 */
export function localDayKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Tanggal lokal hari ini, dengan offset hari (mis. -1 untuk kemarin). */
export function localDayKeyWithOffset(offset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return localDayKey(date)
}
