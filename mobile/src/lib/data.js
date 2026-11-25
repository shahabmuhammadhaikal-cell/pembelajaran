import raw from "../data/kids.json"

export const TOPICS = raw.topics
export const TOPIC_MAP = Object.fromEntries(TOPICS.map(topic => [topic.id, topic]))
export const GROUPS = raw.groups
export const STICKERS = raw.stickers
export const STICKER_MAP = Object.fromEntries(STICKERS.map(sticker => [sticker.id, sticker]))
export const LEVELS = raw.levels
export const STORIES = raw.stories
export const STORY_MAP = Object.fromEntries(STORIES.map(story => [story.id, story]))
export const SENTENCES = raw.sentences

export const TOTAL_WORDS = TOPICS.reduce((sum, topic) => sum + topic.items.length, 0)

/** Bahan permainan: semua kata bergambar, kecuali hijaiyah (gambarnya contoh kata). */
export const PLAY_ITEMS = TOPICS.filter(topic => topic.id !== "hijaiyah").flatMap(topic =>
  topic.items
    .filter(item => item.emoji && item.emoji !== "🔢")
    .map(item => ({ ...item, topicId: topic.id, topicLabel: topic.label }))
)

/** Kata pendek berhuruf latin untuk Susun Kata. */
export const SPELL_ITEMS = (() => {
  const seen = new Set()
  const list = []
  for (const topic of TOPICS) {
    if (["hijaiyah", "greetings", "numbers"].includes(topic.id)) continue
    for (const item of topic.items) {
      const word = String(item.en || "").replace(/[^A-Za-z]/g, "")
      if (word.length < 3 || word.length > 7) continue
      if (seen.has(word.toLowerCase())) continue
      seen.add(word.toLowerCase())
      list.push({ ...item, topicId: topic.id })
    }
  }
  return list
})()

/** Jumlah soal untuk tiap permainan sesuai pengaturan panjang. */
export function roundsFor(length, base) {
  const factor = length === "short" ? 0.6 : length === "long" ? 1.5 : 1
  return Math.max(3, Math.round(base * factor))
}

export function levelFromStars(stars = 0) {
  let current = LEVELS[0]
  for (const entry of LEVELS) if (stars >= entry.min) current = entry
  return current
}

export function levelProgress(stars = 0) {
  const current = levelFromStars(stars)
  const next = LEVELS.find(entry => entry.min > stars) || null
  if (!next) return { current, next: null, percent: 100 }
  const span = Math.max(1, next.min - current.min)
  const percent = Math.round(((stars - current.min) / span) * 100)
  return { current, next, percent: Math.max(0, Math.min(100, percent)) }
}

export function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Kelompokkan topik untuk beranda; topik tak terdaftar masuk "Lainnya". */
export function topicGroups() {
  const placed = new Set()
  const groups = GROUPS.map(group => {
    const topics = group.ids.map(id => TOPIC_MAP[id]).filter(Boolean)
    topics.forEach(topic => placed.add(topic.id))
    return { ...group, topics }
  })
  const rest = TOPICS.filter(topic => !placed.has(topic.id))
  if (rest.length) groups.push({ id: "lainnya", emoji: "✨", title: "Lainnya", topics: rest })
  return groups.filter(group => group.topics.length)
}

/** Kata sulit tersimpan sebagai "topik:kunci" → item siap tampil. */
export function hardWordsFrom(mistakes = {}) {
  const list = []
  for (const [signature, info] of Object.entries(mistakes || {})) {
    const separator = signature.indexOf(":")
    if (separator < 1) continue
    const topicId = signature.slice(0, separator)
    const key = signature.slice(separator + 1)
    const topic = TOPIC_MAP[topicId]
    const item = topic && topic.items.find(entry => entry.key === key)
    if (!topic || !item) continue
    list.push({
      ...item,
      signature,
      topicId,
      topicLabel: topic.label,
      count: (info && info.count) || 1,
      at: (info && info.at) || 0
    })
  }
  return list.sort((a, b) => b.count - a.count || b.at - a.at)
}
