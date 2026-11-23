/**
 * Penggabungan progres akun di server.
 *
 * Tujuannya mencegah data hilang saat dua perangkat menulis bergantian:
 * alih-alih menimpa seluruh dokumen, nilai yang "menang" digabung
 * (bintang & rekor pakai nilai terbesar, daftar disatukan).
 *
 * Penghapusan tidak bisa di-union. Karena itu reset membawa `resetAt`:
 * reset yang lebih baru menang utuh dan mengalahkan data lama dari perangkat
 * lain. Favorit yang dihapus disimpan sebagai nilai 0 (tombstone), sehingga
 * "bukan favorit" juga ikut menang.
 */

const num = value => (Number.isFinite(Number(value)) ? Number(value) : 0)
const maxOf = (a, b) => Math.max(num(a), num(b))
const PROFILE_LIMIT = 6

function objectOf(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function unionObjects(base, incoming) {
  return { ...objectOf(base), ...objectOf(incoming) }
}

/** Favorit menyimpan timestamp: positif = favorit, negatif = dihapus. */
function mergeFavorites(base, incoming) {
  const out = { ...objectOf(base) }
  for (const [key, value] of Object.entries(objectOf(incoming))) {
    const previous = out[key]
    if (previous === undefined || Math.abs(num(value)) >= Math.abs(num(previous))) out[key] = value
  }
  return out
}

function dayOf(daily) {
  return daily && typeof daily.day === "string" ? daily.day : ""
}

function mergeDaily(base, incoming) {
  if (!incoming) return base || null
  if (!base) return incoming
  if (dayOf(base) !== dayOf(incoming)) {
    return dayOf(base) > dayOf(incoming) ? base : incoming
  }
  return {
    ...base,
    ...incoming,
    activities: maxOf(base.activities, incoming.activities),
    claimed: maxOf(base.claimed, incoming.claimed)
  }
}

function mergeStreak(base, incoming) {
  if (!incoming) return base || null
  if (!base) return incoming
  const newer = String(base.last || "") > String(incoming.last || "") ? base : incoming
  return { ...base, ...incoming, ...newer, count: maxOf(base.count, incoming.count) }
}

function mergeKids(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base || null
  if (!base || typeof base !== "object") return incoming

  // Reset terbaru menang utuh; data sebelum reset tidak boleh hidup lagi.
  const baseReset = num(base.resetAt)
  const incomingReset = num(incoming.resetAt)
  if (incomingReset > baseReset) return { ...incoming }
  if (baseReset > incomingReset) return { ...base }

  const best = {}
  for (const key of new Set([...Object.keys(base.best || {}), ...Object.keys(incoming.best || {})])) {
    best[key] = maxOf(base.best && base.best[key], incoming.best && incoming.best[key])
  }
  return {
    ...base,
    ...incoming,
    stars: maxOf(base.stars, incoming.stars),
    learned: unionObjects(base.learned, incoming.learned),
    topicsDone: unionObjects(base.topicsDone, incoming.topicsDone),
    stories: unionObjects(base.stories, incoming.stories),
    stickers: unionObjects(base.stickers, incoming.stickers),
    best,
    daily: mergeDaily(base.daily, incoming.daily),
    streak: mergeStreak(base.streak, incoming.streak),
    lastTopic: incoming.lastTopic || base.lastTopic || "",
    settings: unionObjects(base.settings, incoming.settings),
    resetAt: maxOf(base.resetAt, incoming.resetAt)
  }
}

function profileId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]+/g, "")
    .slice(0, 40)
}

/** Dokumen profil baru, atau progres anak lama dibungkus menjadi satu profil. */
function normalizeKidsDoc(value) {
  if (!value || typeof value !== "object") return null

  if (value.profiles && typeof value.profiles === "object") {
    const profiles = {}
    for (const [rawId, rawProfile] of Object.entries(value.profiles)) {
      const id = profileId(rawId)
      if (!id || !rawProfile || typeof rawProfile !== "object") continue
      profiles[id] = { ...rawProfile, id }
      if (Object.keys(profiles).length >= PROFILE_LIMIT) break
    }
    const ids = Object.keys(profiles)
    if (!ids.length) return null
    return {
      active: profiles[value.active] ? value.active : ids[0],
      profiles
    }
  }

  return { active: "p1", profiles: { p1: { ...value, id: "p1" } } }
}

function mergeKidsDoc(baseValue, incomingValue) {
  const base = normalizeKidsDoc(baseValue)
  const incoming = normalizeKidsDoc(incomingValue)
  if (!incoming) return base
  if (!base) return incoming

  const profiles = { ...base.profiles }
  for (const profile of Object.values(incoming.profiles)) {
    profiles[profile.id] = profiles[profile.id]
      ? mergeKids(profiles[profile.id], profile)
      : profile
  }

  const ids = Object.keys(profiles).slice(0, PROFILE_LIMIT)
  const nextProfiles = {}
  ids.forEach(id => {
    nextProfiles[id] = profiles[id]
  })

  return {
    active: nextProfiles[incoming.active]
      ? incoming.active
      : nextProfiles[base.active]
        ? base.active
        : ids[0],
    profiles: nextProfiles
  }
}

function keyOf(item) {
  if (item === null || item === undefined) return ""
  if (typeof item !== "object") return String(item)
  return String(item.en || item.text || item.ar || item.id || JSON.stringify(item))
}

function unionList(base, incoming, limit = 0) {
  const seen = new Set()
  const out = []
  for (const item of [...(incoming || []), ...(base || [])]) {
    const key = keyOf(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return limit > 0 ? out.slice(0, limit) : out
}

function mergeChallenge(base, incoming) {
  if (!incoming) return base || null
  if (!base) return incoming
  const baseDay = String(base.day || "")
  const incomingDay = String(incoming.day || "")
  if (baseDay !== incomingDay) return baseDay > incomingDay ? base : incoming
  return {
    ...base,
    ...incoming,
    correct: maxOf(base.correct, incoming.correct),
    total: maxOf(base.total, incoming.total),
    doneAt: maxOf(base.doneAt, incoming.doneAt)
  }
}

function mergeAdultProgress(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base || null
  if (!base || typeof base !== "object") return incoming

  const baseReset = num(base.resetAt)
  const incomingReset = num(incoming.resetAt)
  if (incomingReset > baseReset) return { ...incoming }
  if (baseReset > incomingReset) return { ...base }

  return {
    ...base,
    ...incoming,
    srs: unionObjects(base.srs, incoming.srs),
    // Timestamp favorit negatif adalah tombstone "bukan favorit".
    favorites: mergeFavorites(base.favorites, incoming.favorites),
    quizErrors: unionList(base.quizErrors, incoming.quizErrors, 60),
    translateHistory: unionList(base.translateHistory, incoming.translateHistory, 20),
    customEntries: unionList(base.customEntries, incoming.customEntries, 200),
    bestDaily: maxOf(base.bestDaily, incoming.bestDaily),
    bestStreak: maxOf(base.bestStreak, incoming.bestStreak),
    streak: maxOf(base.streak, incoming.streak),
    dailyChallenge: mergeChallenge(base.dailyChallenge, incoming.dailyChallenge),
    resetAt: maxOf(base.resetAt, incoming.resetAt)
  }
}

function mergeAdult(base, incoming) {
  if (!incoming || typeof incoming !== "object") return base || null
  if (!base || typeof base !== "object") return incoming
  return {
    ...base,
    ...incoming,
    progress: mergeAdultProgress(base.progress, incoming.progress),
    settings: unionObjects(base.settings, incoming.settings)
  }
}

function mergeProfile(baseValue, incomingValue) {
  if (!incomingValue || typeof incomingValue !== "object") return baseValue || null
  const base = objectOf(baseValue)
  const incoming = objectOf(incomingValue)
  const out = { ...base, ...incoming }
  if (incoming.dailyChallenge !== undefined) {
    out.dailyChallenge = mergeChallenge(base.dailyChallenge, incoming.dailyChallenge)
  }
  return out
}

function mergeAccount(existing, incoming) {
  const base = existing && typeof existing === "object" ? existing : {}
  const patch = incoming && typeof incoming === "object" ? incoming : {}
  const merged = {}
  const kids = mergeKidsDoc(base.kids, patch.kids)
  const adult = mergeAdult(base.adult, patch.adult)
  const profile = mergeProfile(base.profile, patch.profile)
  if (kids) merged.kids = kids
  if (adult) merged.adult = adult
  if (profile) merged.profile = profile
  return merged
}

module.exports = {
  mergeAccount,
  mergeKids,
  mergeKidsDoc,
  mergeAdult,
  mergeAdultProgress,
  mergeFavorites,
  mergeProfile,
  normalizeKidsDoc
}
