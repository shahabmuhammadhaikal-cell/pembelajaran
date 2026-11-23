/**
 * Ringkasan statistik akun untuk badge header, kartu profil, dan papan
 * peringkat. Dihitung dari dokumen akun yang sudah digabung, jadi angkanya
 * konsisten di semua perangkat.
 */
const { levelFromPoints, nextLevelFromPoints } = require("./accountLevel")

const num = value => (Number.isFinite(Number(value)) ? Number(value) : 0)

function summarizeAccount(account) {
  const source = account && typeof account === "object" ? account : {}

  let stars = 0
  let streak = 0
  const kids = source.kids
  if (kids && typeof kids === "object" && kids.profiles && typeof kids.profiles === "object") {
    for (const profile of Object.values(kids.profiles)) {
      if (!profile || typeof profile !== "object") continue
      stars += Math.max(0, Math.round(num(profile.stars)))
      streak = Math.max(streak, Math.round(num(profile.streak && profile.streak.count)))
    }
  }

  let mastered = 0
  let attempts = 0
  const adult = source.adult
  if (adult && adult.progress && typeof adult.progress === "object") {
    const progress = adult.progress
    for (const entry of Object.values(progress.srs || {})) {
      if (!entry || typeof entry !== "object") continue
      attempts += Math.max(0, Math.round(num(entry.attempts)))
      if (num(entry.level) >= 5 && num(entry.streak) >= 2) mastered += 1
    }
    streak = Math.max(
      streak,
      Math.round(num(progress.bestStreak)),
      Math.round(num(progress.streak))
    )
  }

  const favorites = adult && adult.progress && adult.progress.favorites
    ? Object.values(adult.progress.favorites).filter(value => num(value) > 0).length
    : 0

  const points = stars * 10 + mastered * 5 + streak * 3
  const current = levelFromPoints(points)
  const next = nextLevelFromPoints(points)

  return {
    points,
    stars,
    mastered,
    streak,
    attempts,
    favorites,
    level: current.level,
    levelTitle: current.title,
    levelAvatar: current.avatar,
    nextLevel: next ? next.level : null,
    nextPoints: next ? next.min : null
  }
}

module.exports = { summarizeAccount }
