/** Gabungkan progres dewasa dari akun dengan progres lokal tanpa kehilangan data. */
import { pruneQuizErrors } from "./srs.js"

const resetOf = value => Math.max(0, Number(value && value.resetAt) || 0)

/** Favorit menyimpan timestamp: positif = favorit, negatif = dihapus. */
function mergeFavorites(base, remote) {
  const out = { ...(base || {}) }
  for (const [key, value] of Object.entries(remote || {})) {
    const previous = out[key]
    if (previous === undefined || Math.abs(Number(value) || 0) >= Math.abs(Number(previous) || 0)) {
      out[key] = value
    }
  }
  return out
}

export function mergeAdultProgress(local, remote) {
  if (!remote || typeof remote !== "object") return local
  const base = local || {}

  // Reset yang lebih baru menang utuh, termasuk untuk SRS/favorit/riwayat.
  if (resetOf(remote) > resetOf(base)) return remote
  if (resetOf(base) > resetOf(remote)) return base

  const history = remote.translateHistory || []
  return {
    ...base,
    ...remote,
    srs: { ...(base.srs || {}), ...(remote.srs || {}) },
    // Timestamp favorit negatif adalah tombstone "bukan favorit".
    favorites: mergeFavorites(base.favorites, remote.favorites),
    quizErrors: pruneQuizErrors([...(remote.quizErrors || []), ...(base.quizErrors || [])]),
    translateHistory: [
      ...history.slice(0, 20),
      ...(base.translateHistory || []).filter(item => history.every(other => other.text !== item.text))
    ].slice(0, 20),
    customEntries: Array.from(
      new Map(
        [...(base.customEntries || []), ...(remote.customEntries || [])].map(item => [
          `${item.en}|${item.ar}|${item.id}`,
          item
        ])
      ).values()
    ),
    // Penghitung tidak boleh turun saat data lokal lebih baru dari server.
    completedToday: Math.max(Number(base.completedToday) || 0, Number(remote.completedToday) || 0),
    bestDaily: Math.max(Number(base.bestDaily) || 0, Number(remote.bestDaily) || 0),
    bestStreak: Math.max(Number(base.bestStreak) || 0, Number(remote.bestStreak) || 0),
    streak: Math.max(Number(base.streak) || 0, Number(remote.streak) || 0),
    lastStudy: Math.max(Number(base.lastStudy) || 0, Number(remote.lastStudy) || 0),
    resetAt: Math.max(resetOf(base), resetOf(remote))
  }
}
