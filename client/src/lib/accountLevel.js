/**
 * Level akun (bukan level kata SRS) dihitung dari poin:
 * bintang Mode Anak × 10 + kata dikuasai × 5 + hari beruntun × 3.
 * Tabel ini harus sama dengan server/lib/accountLevel.js.
 */
export const ACCOUNT_LEVELS = [
  { level: 1, min: 0, title: "Pemula", avatar: "🌱" },
  { level: 2, min: 150, title: "Penjelajah", avatar: "🧭" },
  { level: 3, min: 400, title: "Pembelajar", avatar: "📚" },
  { level: 4, min: 800, title: "Mahir", avatar: "🚀" },
  { level: 5, min: 1400, title: "Ahli", avatar: "🏆" },
  { level: 6, min: 2200, title: "Legenda", avatar: "👑" }
]

export const AVATAR_CHOICES = ["🦉", "🐣", "🐧", "🦊", "🐼", "🐨", "🦄", "🐬", "🌟", "🚀", "📚", "🎯"]

export function levelFromPoints(points = 0) {
  const value = Number(points) || 0
  let current = ACCOUNT_LEVELS[0]
  for (const entry of ACCOUNT_LEVELS) {
    if (value >= entry.min) current = entry
  }
  return current
}

export function levelProgress(points = 0) {
  const value = Math.max(0, Number(points) || 0)
  const current = levelFromPoints(value)
  const next = ACCOUNT_LEVELS.find(entry => entry.min > value) || null
  if (!next) return { current, next: null, percent: 100 }
  const span = Math.max(1, next.min - current.min)
  return {
    current,
    next,
    percent: Math.max(0, Math.min(100, Math.round(((value - current.min) / span) * 100)))
  }
}

/** Hitung poin dari data yang tersedia di klien (cadangan bila stats server kosong). */
export function accountPoints({ stars = 0, mastered = 0, streak = 0 } = {}) {
  return Math.max(0, Math.round(stars)) * 10 + Math.max(0, Math.round(mastered)) * 5 + Math.max(0, Math.round(streak)) * 3
}

/** Inisial dari nama tampilan atau email. */
export function accountInitial(profile, email = "") {
  const name = String((profile && profile.name) || "").trim()
  const source = name || String(email || "").trim()
  return source ? source.slice(0, 1).toUpperCase() : "?"
}

export function accountDisplayName(profile, email = "") {
  const name = String((profile && profile.name) || "").trim()
  if (name) return name
  const mail = String(email || "").trim()
  return mail ? mail.split("@")[0] : "Pembelajar"
}
