/**
 * Tantangan harian yang sama untuk semua orang pada tanggal yang sama.
 * Kategori dipilih dari katalog yang sudah dimuat, lalu diacak stabil
 * memakai hash tanggal sehingga tidak berubah saat halaman dimuat ulang.
 */
export const CHALLENGE_TOTAL = 10
export const CHALLENGE_TARGET = 8
export const CHALLENGE_BONUS = 20

export function dayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function hashString(value) {
  let hash = 2166136261
  const text = String(value || "")
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

export function dailyChallenge(categories, date = new Date()) {
  const key = dayKey(date)
  const pool = Array.isArray(categories) && categories.length
    ? categories.filter(category => category && category.id)
    : [{ id: "greetings", name: "Sapaan" }]
  const category = pool[hashString(key) % pool.length]
  return {
    day: key,
    categoryId: category.id,
    categoryName: category.name || category.id,
    total: CHALLENGE_TOTAL,
    target: CHALLENGE_TARGET,
    bonus: CHALLENGE_BONUS
  }
}

export function challengeDone(progress, challenge) {
  const value = progress && progress.dailyChallenge
  if (!value || !challenge) return false
  if (value.day !== challenge.day) return false
  return Number(value.correct) >= challenge.target
}
