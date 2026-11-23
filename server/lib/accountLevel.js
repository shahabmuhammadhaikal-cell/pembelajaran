/**
 * Level akun dihitung dari poin, bukan dari role.
 *
 * Poin = bintang Mode Anak × 10 + kata dikuasai × 5 + hari beruntun × 3.
 * Tabel ini harus sama dengan client/src/lib/accountLevel.js.
 */
const ACCOUNT_LEVELS = [
  { level: 1, min: 0, title: "Pemula", avatar: "🌱" },
  { level: 2, min: 150, title: "Penjelajah", avatar: "🧭" },
  { level: 3, min: 400, title: "Pembelajar", avatar: "📚" },
  { level: 4, min: 800, title: "Mahir", avatar: "🚀" },
  { level: 5, min: 1400, title: "Ahli", avatar: "🏆" },
  { level: 6, min: 2200, title: "Legenda", avatar: "👑" }
]

function levelFromPoints(points = 0) {
  let current = ACCOUNT_LEVELS[0]
  for (const entry of ACCOUNT_LEVELS) {
    if (Number(points) >= entry.min) current = entry
  }
  return current
}

function nextLevelFromPoints(points = 0) {
  return ACCOUNT_LEVELS.find(entry => entry.min > Number(points)) || null
}

module.exports = { ACCOUNT_LEVELS, levelFromPoints, nextLevelFromPoints }
