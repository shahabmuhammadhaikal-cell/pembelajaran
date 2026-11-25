/**
 * Progres Mode Anak sekarang disimpan sebagai dokumen profil:
 *
 *   { active: "p1", profiles: { p1: { id, name, avatar, ...progres } } }
 *
 * Data lama yang masih berupa satu objek progres otomatis dibungkus menjadi
 * profil "p1". Setiap profil punya `resetAt`; reset yang lebih baru menang,
 * sehingga tombol "Ulangi progres" tidak dibatalkan oleh data lama dari akun.
 */

export const PROFILE_LIMIT = 6

export const KIDS_PROFILE_DEFAULTS = {
  stars: 0,
  learned: {},
  topicsDone: {},
  stories: {},
  stickers: {},
  best: { listen: 0, guess: 0, spell: 0, match: 0, count: 0 },
  lastTopic: "",
  daily: { day: "", activities: 0, goal: 3, claimed: 0 },
  streak: { last: "", count: 0 },
  settings: { lang: "id", slow: false, sound: true, length: "normal" },
  resetAt: 0
}

const num = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const maxOf = (a, b) => Math.max(num(a), num(b))
const objectOf = value => (value && typeof value === "object" && !Array.isArray(value) ? value : {})
const textOf = (value, max = 40) => String(value || "").trim().slice(0, max)

function idOf(value) {
  return textOf(value, 40).replace(/[^a-zA-Z0-9_-]+/g, "")
}

export function normalizeProfile(value, id, fallbackName = "Anak 1") {
  const source = objectOf(value)
  const profileId = idOf(id || source.id) || "p1"
  return {
    ...KIDS_PROFILE_DEFAULTS,
    ...source,
    id: profileId,
    name: textOf(source.name, 40) || fallbackName,
    avatar: textOf(source.avatar, 8) || "🦉",
    resetAt: Math.max(0, num(source.resetAt)),
    stars: Math.max(0, Math.round(num(source.stars))),
    learned: { ...objectOf(source.learned) },
    topicsDone: { ...objectOf(source.topicsDone) },
    stories: { ...objectOf(source.stories) },
    stickers: { ...objectOf(source.stickers) },
    best: { ...KIDS_PROFILE_DEFAULTS.best, ...objectOf(source.best) },
    daily: { ...KIDS_PROFILE_DEFAULTS.daily, ...objectOf(source.daily) },
    streak: { ...KIDS_PROFILE_DEFAULTS.streak, ...objectOf(source.streak) },
    settings: { ...KIDS_PROFILE_DEFAULTS.settings, ...objectOf(source.settings) },
    lastTopic: typeof source.lastTopic === "string" ? source.lastTopic : ""
  }
}

export function newProfile(id, name) {
  return normalizeProfile({ id, name }, id, name || "Anak")
}

function profileHasProgress(profile) {
  if (!profile) return false
  return Boolean(
    (profile.resetAt || 0) > 0 ||
      (profile.stars || 0) > 0 ||
      Object.keys(profile.learned || {}).length ||
      Object.keys(profile.topicsDone || {}).length ||
      Object.keys(profile.stories || {}).length ||
      Object.keys(profile.stickers || {}).length ||
      Object.values(profile.best || {}).some(value => Number(value) > 0) ||
      profile.lastTopic ||
      (profile.daily && ((profile.daily.activities || 0) > 0 || profile.daily.claimed)) ||
      (profile.streak && (profile.streak.count || 0) > 0)
  )
}

/** Apakah ada progres nyata di salah satu profil (bukan dokumen kosong bawaan). */
export function kidsDocHasProgress(value) {
  const doc = normalizeKidsDoc(value)
  if (!doc) return false
  return Object.values(doc.profiles).some(profileHasProgress)
}

/**
 * Terima dokumen profil baru maupun progres anak versi lama (satu objek).
 * Mengembalikan null bila tidak ada data yang bisa dipakai.
 */
export function normalizeKidsDoc(value) {
  if (!value || typeof value !== "object") return null

  if (value.profiles && typeof value.profiles === "object") {
    const profiles = {}
    for (const [rawId, rawProfile] of Object.entries(value.profiles)) {
      const id = idOf(rawId)
      if (!id || !rawProfile || typeof rawProfile !== "object") continue
      profiles[id] = normalizeProfile(rawProfile, id, `Anak ${Object.keys(profiles).length + 1}`)
      if (Object.keys(profiles).length >= PROFILE_LIMIT) break
    }
    const ids = Object.keys(profiles)
    if (!ids.length) return null
    const active = profiles[value.active] ? value.active : ids[0]
    return { active, profiles }
  }

  return {
    active: "p1",
    profiles: { p1: normalizeProfile(value, "p1", "Anak 1") }
  }
}

export function mergeKids(localValue, remoteValue) {
  if (!remoteValue || typeof remoteValue !== "object") return normalizeProfile(localValue)
  if (!localValue || typeof localValue !== "object") return normalizeProfile(remoteValue)

  const local = normalizeProfile(localValue)
  const remote = normalizeProfile(remoteValue, local.id, local.name)

  // Reset terbaru menang utuh; data sebelum reset tidak boleh hidup lagi.
  if (remote.resetAt > local.resetAt) return { ...remote, id: local.id, name: local.name }
  if (local.resetAt > remote.resetAt) return local

  const best = {}
  const bestKeys = new Set([...Object.keys(local.best || {}), ...Object.keys(remote.best || {})])
  bestKeys.forEach(key => {
    best[key] = maxOf(local.best && local.best[key], remote.best && remote.best[key])
  })

  let daily = local.daily
  if (remote.daily) {
    if (!local.daily || local.daily.day !== remote.daily.day) {
      daily =
        (local.daily && local.daily.day ? local.daily.day : "") > (remote.daily.day || "")
          ? local.daily
          : remote.daily
    } else {
      daily = {
        ...local.daily,
        activities: maxOf(local.daily.activities, remote.daily.activities),
        claimed: local.daily.claimed || remote.daily.claimed || 0
      }
    }
  }

  const localStreak = local.streak || {}
  const remoteStreak = remote.streak || {}
  const newerStreak = (localStreak.last || "") >= (remoteStreak.last || "") ? localStreak : remoteStreak
  const streak = {
    ...remoteStreak,
    ...newerStreak,
    count: maxOf(localStreak.count, remoteStreak.count)
  }

  return {
    ...local,
    stars: maxOf(local.stars, remote.stars),
    learned: { ...remote.learned, ...local.learned },
    topicsDone: { ...remote.topicsDone, ...local.topicsDone },
    stories: { ...remote.stories, ...local.stories },
    stickers: { ...remote.stickers, ...local.stickers },
    best,
    daily,
    streak,
    lastTopic: local.lastTopic || remote.lastTopic || "",
    settings: { ...remote.settings, ...local.settings },
    resetAt: maxOf(local.resetAt, remote.resetAt)
  }
}

/** Hapus penanda reset (dipakai saat data tamu pertama kali digabung ke akun). */
export function stripResetTimestamps(value) {
  const doc = normalizeKidsDoc(value)
  if (!doc) return null
  const profiles = {}
  for (const [id, profile] of Object.entries(doc.profiles)) {
    profiles[id] = { ...profile, resetAt: 0 }
  }
  return { ...doc, profiles }
}

/** Gabungkan dua dokumen profil; profil aktif lokal dipertahankan saat refresh. */
export function mergeKidsDoc(localValue, remoteValue) {
  const local = normalizeKidsDoc(localValue)
  const remote = normalizeKidsDoc(remoteValue)
  if (!remote) return local
  if (!local) return remote

  const profiles = { ...local.profiles }
  for (const profile of Object.values(remote.profiles)) {
    profiles[profile.id] = profiles[profile.id]
      ? mergeKids(profiles[profile.id], profile)
      : profile
  }

  const ids = Object.keys(profiles).slice(0, PROFILE_LIMIT)
  const nextProfiles = {}
  ids.forEach(id => {
    nextProfiles[id] = profiles[id]
  })

  const active = nextProfiles[local.active]
    ? local.active
    : nextProfiles[remote.active]
      ? remote.active
      : ids[0]

  return { active, profiles: nextProfiles }
}
