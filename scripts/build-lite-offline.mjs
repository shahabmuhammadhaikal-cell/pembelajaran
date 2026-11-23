/**
 * Membuat satu file HTML mandiri untuk aplikasi versi ringan (ES5).
 * Hasilnya bisa dibuka langsung dari Files/AirDrop di iPad lama tanpa server
 * maupun login, karena CSS, JS, dan seluruh data ditanam di dalam file.
 *
 * Pakai: node scripts/build-lite-offline.mjs
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..")
const publicDir = path.join(root, "client", "public")
const dataDir = path.join(root, "assets", "data")
const outFile = path.join(publicDir, "lite-offline.html")

// Kategori raksasa (10.000 kalimat) dilewati agar file tetap ringan di perangkat lama.
const MAX_ENTRIES_BYTES = 1024 * 1024

const [html, css, js] = await Promise.all([
  readFile(path.join(publicDir, "lite.html"), "utf8"),
  readFile(path.join(publicDir, "lite", "lite.css"), "utf8"),
  readFile(path.join(publicDir, "lite", "lite.js"), "utf8")
])

const catalog = JSON.parse(await readFile(path.join(dataDir, "catalog.json"), "utf8"))
const data = {}
const keptCategories = []
let skipped = 0

for (const category of catalog.categories || []) {
  const source = catalog.entry_files?.[category.id]
  if (!source) continue
  const file = path.join(root, source)
  const info = await stat(file).catch(() => null)
  if (!info || info.size > MAX_ENTRIES_BYTES) {
    skipped++
    continue
  }
  const key = `data/categories/${category.id}.json`
  data[key] = JSON.parse(await readFile(file, "utf8"))
  keptCategories.push(category)
}

// Dua kategori khusus memakai file di luar folder categories.
for (const special of ["animals", "vegetables"]) {
  const file = path.join(root, "assets", special, `${special}.json`)
  const info = await stat(file).catch(() => null)
  if (!info) continue
  if (!keptCategories.some(item => item.id === special)) {
    const listed = (catalog.categories || []).find(item => item.id === special)
    keptCategories.push(listed || { id: special, name: special })
  }
  data[`data/${special}.json`] = JSON.parse(await readFile(file, "utf8"))
}

data["data/catalog.json"] = { categories: keptCategories }

const totalEntries = Object.keys(data).reduce((sum, key) => {
  const value = data[key]
  if (Array.isArray(value)) return sum + value.length
  return sum
}, 0)

// Cegah tag penutup script di dalam data memotong blok inline.
const inlineData = JSON.stringify(data).replace(/<\//g, "<\\/")

const page = html
  .replace(
    '<link rel="stylesheet" href="lite/lite.css" />',
    `<style>\n${css.replace(/<\//g, "<\\/")}\n</style>`
  )
  .replace(
    '<script src="lite/lite.js"></script>',
    `<script>window.LITE_DATA = ${inlineData};</script>\n<script>\n${js.replace(
      /<\//g,
      "<\\/"
    )}\n</script>`
  )

await writeFile(outFile, page, "utf8")

const sizeMb = (Buffer.byteLength(page) / 1024 / 1024).toFixed(2)
console.log(
  `[lite-offline] ${path.relative(root, outFile)} · ${keptCategories.length} kategori · ${totalEntries} kata · ${sizeMb} MB · dilewati ${skipped}`
)
