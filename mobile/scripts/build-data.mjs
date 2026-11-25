/**
 * Menyalin materi Mode Anak dari aplikasi web ke aplikasi Expo.
 * Jalankan: npm run data  (dari folder mobile/)
 *
 * Hasilnya mobile/src/data/kids.json supaya aplikasi mobile tetap mandiri
 * dan bisa dibundel tanpa membaca folder client saat build.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "../..")

const kidsData = await import(resolve(root, "client/src/lib/kidsData.js"))
const kidsStories = await import(resolve(root, "client/src/lib/kidsStories.js"))
const kidsSentences = await import(resolve(root, "client/src/lib/kidsSentences.js"))

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  topics: kidsData.KID_TOPICS,
  groups: kidsData.KID_TOPIC_GROUPS,
  stickers: kidsData.KID_STICKERS,
  levels: kidsData.KID_LEVELS,
  stories: kidsStories.KID_STORIES,
  sentences: kidsSentences.KID_SENTENCES
}

const target = resolve(here, "../src/data/kids.json")
await mkdir(dirname(target), { recursive: true })
await writeFile(target, JSON.stringify(payload), "utf8")

console.log(
  `kids.json: ${payload.topics.length} topik, ${payload.topics.reduce(
    (sum, topic) => sum + topic.items.length,
    0
  )} kata, ${payload.stories.length} cerita, ${payload.sentences.length} kalimat`
)
