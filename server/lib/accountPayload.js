/**
 * Validasi dan normalisasi payload progres akun.
 *
 * Endpoint akun tidak boleh menerima JSON sembarang: dokumen Firestore
 * dibatasi 1 MB, dan daftar seperti riwayat/entri kustom bisa tumbuh tanpa
 * batas. Semua data dipangkas ke bentuk yang dikenal sebelum digabung.
 */

const MAX_BYTES = 256 * 1024
const MAX_PROFILES = 6
const MAX_LEARNED = 4000
const MAX_REWARDS = 2000
const MAX_SRS = 5000
const MAX_FAVORITES = 3000
const MAX_ERRORS = 60
const MAX_HISTORY = 20
const MAX_CUSTOM = 200
const MAX_SETTINGS = 40
const MAX_NAME = 40
const MAX_AVATAR = 8

function fail(message, status = 422) {
  const error = new Error(message)
  error.status = status
  throw error
}

function safeKey(value) {
  const key = text(value, 160)
  if (!key) return ""
  if (key === "__proto__" || key === "constructor" || key === "prototype") return ""
  return key
}

function plain(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null
}

function text(value, max = 200) {
  return String(value == null ? "" : value).slice(0, max)
}

function number(value, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(-max, Math.min(max, parsed))
}

function counter(value) {
  return Math.max(0, Math.round(number(value)))
}

function counterMap(value, limit = MAX_REWARDS) {
  const source = plain(value)
  const out = {}
  if (!source) return out
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (count >= limit) break
    const key = safeKey(rawKey)
    if (!key) continue
    out[key] = counter(rawValue)
    count += 1
  }
  return out
}

function settingsOf(value) {
  const source = plain(value)
  const out = {}
  if (!source) return out
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (count >= MAX_SETTINGS) break
    const key = safeKey(rawKey)
    if (!key) continue
    const type = typeof rawValue
    if (type === "string") out[key] = text(rawValue, 120)
    else if (type === "number") out[key] = number(rawValue, 1_000_000)
    else if (type === "boolean") out[key] = rawValue
    count += 1
  }
  return out
}

function bestOf(value) {
  const source = plain(value)
  const out = {}
  if (!source) return out
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (count >= 30) break
    const key = safeKey(rawKey)
    if (!key) continue
    out[key] = counter(rawValue)
    count += 1
  }
  return out
}

function dailyOf(value) {
  const source = plain(value)
  if (!source) return { day: "", activities: 0, goal: 3, claimed: 0 }
  return {
    day: text(source.day, 20),
    activities: counter(source.activities),
    goal: Math.max(1, counter(source.goal) || 3),
    claimed: counter(source.claimed)
  }
}

function streakOf(value) {
  const source = plain(value)
  if (!source) return { last: "", count: 0 }
  return { last: text(source.last, 20), count: counter(source.count) }
}

function srsEntry(value) {
  const source = plain(value) || {}
  return {
    level: Math.max(1, counter(source.level) || 1),
    attempts: counter(source.attempts),
    correct: counter(source.correct),
    wrong: counter(source.wrong),
    streak: counter(source.streak),
    lastSeen: counter(source.lastSeen),
    lastWrong: counter(source.lastWrong),
    avgMs: counter(source.avgMs),
    lastMs: counter(source.lastMs)
  }
}

function srsMap(value) {
  const source = plain(value)
  const out = {}
  if (!source) return out
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (count >= MAX_SRS) break
    const key = safeKey(rawKey)
    if (!key) continue
    out[key] = srsEntry(rawValue)
    count += 1
  }
  return out
}

function quizErrors(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_ERRORS).map(item => {
    const source = plain(item) || {}
    return {
      key: text(source.key, 160),
      ts: counter(source.ts),
      timedOut: !!source.timedOut,
      en: text(source.en, 80),
      ar: text(source.ar, 80),
      id: text(source.id, 80),
      category: text(source.category, 80)
    }
  })
}

function translateHistory(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_HISTORY).map(item => {
    const source = plain(item) || {}
    return {
      text: text(source.text, 300),
      en: text(source.en, 300),
      ar: text(source.ar, 300),
      id: text(source.id, 300),
      ts: counter(source.ts)
    }
  })
}

function customEntries(value) {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_CUSTOM).map(item => {
    const source = plain(item) || {}
    return { en: text(source.en, 120), ar: text(source.ar, 120), id: text(source.id, 120) }
  })
}

function favoritesOf(value) {
  const source = plain(value)
  const out = {}
  if (!source) return out
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (count >= MAX_FAVORITES) break
    const key = safeKey(rawKey)
    if (!key) continue
    out[key] = Math.trunc(number(rawValue, 9_000_000_000_000_000))
    count += 1
  }
  return out
}

/** Profil tampilan akun: nama panggilan, avatar, target harian, dsb. */
function profileOf(value) {
  const source = plain(value)
  if (!source) fail("profile harus berupa objek")
  const out = {}
  if (source.name !== undefined) out.name = String(source.name == null ? "" : source.name).trim().slice(0, MAX_NAME)
  if (source.avatar !== undefined) out.avatar = String(source.avatar == null ? "" : source.avatar).trim().slice(0, MAX_AVATAR)
  if (source.dailyGoal !== undefined) out.dailyGoal = Math.max(1, Math.min(60, counter(source.dailyGoal) || 10))
  if (source.onboarded !== undefined) out.onboarded = !!source.onboarded
  if (source.leaderboard !== undefined) out.leaderboard = !!source.leaderboard
  if (source.dailyChallenge !== undefined) {
    const challenge = plain(source.dailyChallenge)
    out.dailyChallenge = challenge
      ? {
          day: text(challenge.day, 20),
          correct: counter(challenge.correct),
          total: counter(challenge.total),
          doneAt: counter(challenge.doneAt)
        }
      : null
  }
  if (!Object.keys(out).length) fail("profile tidak berisi field yang dikenal")
  return out
}

function kidsProfile(value, fallbackId = "p1") {
  const source = plain(value) || {}
  return {
    id: String(source.id || fallbackId).replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 40) || fallbackId,
    name: text(source.name, 40),
    avatar: text(source.avatar, 8),
    resetAt: counter(source.resetAt),
    stars: counter(source.stars),
    learned: counterMap(source.learned, MAX_LEARNED),
    topicsDone: counterMap(source.topicsDone, MAX_REWARDS),
    stories: counterMap(source.stories, MAX_REWARDS),
    stickers: counterMap(source.stickers, MAX_REWARDS),
    best: bestOf(source.best),
    lastTopic: text(source.lastTopic, 80),
    daily: dailyOf(source.daily),
    streak: streakOf(source.streak),
    settings: settingsOf(source.settings)
  }
}

function kidsDoc(value) {
  const source = plain(value)
  if (!source) fail("kids harus berupa objek")

  if (plain(source.profiles)) {
    const profiles = {}
    for (const [rawId, rawProfile] of Object.entries(source.profiles)) {
      if (Object.keys(profiles).length >= MAX_PROFILES) break
      const id = String(rawId).replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 40)
      if (!id || !plain(rawProfile)) continue
      profiles[id] = kidsProfile(rawProfile, id)
    }
    const ids = Object.keys(profiles)
    if (!ids.length) fail("kids.profiles tidak boleh kosong")
    return { active: profiles[source.active] ? source.active : ids[0], profiles }
  }

  return { active: "p1", profiles: { p1: kidsProfile({ ...source, id: "p1" }, "p1") } }
}

function adultProgress(value) {
  const source = plain(value)
  if (!source) return null
  return {
    srs: srsMap(source.srs),
    dailyChallenge: plain(source.dailyChallenge)
      ? {
          day: text(source.dailyChallenge.day, 20),
          correct: counter(source.dailyChallenge.correct),
          total: counter(source.dailyChallenge.total),
          doneAt: counter(source.dailyChallenge.doneAt)
        }
      : null,
    favorites: favoritesOf(source.favorites),
    quizErrors: quizErrors(source.quizErrors),
    translateHistory: translateHistory(source.translateHistory),
    customEntries: customEntries(source.customEntries),
    dayStamp: text(source.dayStamp, 40),
    completedToday: counter(source.completedToday),
    streak: counter(source.streak),
    bestStreak: counter(source.bestStreak),
    bestDaily: counter(source.bestDaily),
    lastStudy: counter(source.lastStudy),
    goal: counter(source.goal),
    resetAt: counter(source.resetAt)
  }
}

function adult(value) {
  const source = plain(value)
  if (!source) fail("adult harus berupa objek")
  return { progress: adultProgress(source.progress), settings: settingsOf(source.settings) }
}

function sanitizeAccountPatch(body) {
  const source = plain(body)
  if (!source) fail("payload harus berupa objek")

  const bytes = Buffer.byteLength(JSON.stringify(source), "utf8")
  if (bytes > MAX_BYTES) fail(`payload terlalu besar (${bytes} byte, maksimal ${MAX_BYTES})`, 413)

  const out = {}
  if (source.kids !== undefined && source.kids !== null) out.kids = kidsDoc(source.kids)
  if (source.adult !== undefined && source.adult !== null) out.adult = adult(source.adult)
  if (source.profile !== undefined && source.profile !== null) out.profile = profileOf(source.profile)
  if (!out.kids && !out.adult && !out.profile) fail("payload harus berisi kids, adult, atau profile")
  return out
}

module.exports = { sanitizeAccountPatch, profileOf, MAX_BYTES, MAX_PROFILES }
