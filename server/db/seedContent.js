/**
 * Penulisan konten statis (assets/data) ke Firestore.
 *
 * Dipakai dua tempat agar tidak ada logika ganda:
 *   - scripts/seed-firestore.js  (dijalankan manual dari mesin yang punya kredensial)
 *   - db/index.js                 (sinkronisasi startup: katalog kosong atau data lokal berubah)
 *
 * Semua penulisan memakai `set` pada dokumen yang sama, jadi aman diulang.
 */
const path = require("path")
const crypto = require("crypto")
const fsp = require("fs/promises")

const ROOT = path.resolve(__dirname, "..", "..")
const DATA_DIR = path.join(ROOT, "assets", "data")

const CHUNK_MAX_BYTES = 700 * 1024 // aman di bawah limit dokumen Firestore 1MB
const BATCH_LIMIT = 400 // batas Firestore 500, sisakan ruang

function chunkItems(items, maxBytes = CHUNK_MAX_BYTES) {
  const chunks = []
  let current = []
  let size = 2
  for (const item of items) {
    const itemSize = Buffer.byteLength(JSON.stringify(item)) + 1
    if (current.length && size + itemSize > maxBytes) {
      chunks.push(current)
      current = []
      size = 2
    }
    current.push(item)
    size += itemSize
  }
  if (current.length) chunks.push(current)
  return chunks.length ? chunks : [[]]
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"))
  } catch {
    return fallback
  }
}

/** Baca katalog + entri + saran kata dari assets/ (sumber yang sama dengan seed manual). */
async function loadLocalData({ rootDir = ROOT, dataDir = DATA_DIR } = {}) {
  const catalog = await readJson(path.join(dataDir, "catalog.json"), { categories: [] })
  const categories = []
  const allEntries = []

  for (const [order, category] of (catalog.categories || []).entries()) {
    let items = []
    if (category.id === "animals") {
      items = await readJson(path.join(rootDir, "assets", "animals", "animals.json"), [])
    } else if (category.id === "vegetables") {
      items = await readJson(path.join(rootDir, "assets", "vegetables", "vegetables.json"), [])
    } else {
      items = await readJson(path.join(dataDir, "categories", `${category.id}.json`), [])
    }
    if (!Array.isArray(items)) items = []
    categories.push({ id: category.id, name: category.name, count: items.length, order })
    for (const item of items) allEntries.push({ ...item, __category: category.id })
  }

  const suggestions = await readJson(path.join(dataDir, "word_suggestions.json"), [])
  return { categories, allEntries, suggestions: Array.isArray(suggestions) ? suggestions : [] }
}

/**
 * Sidik jari isi assets/ (kategori, entri, saran kata). Dipakai agar startup
 * hanya menulis ulang Firestore ketika data lokal benar-benar berubah.
 */
function contentFingerprint({ categories = [], allEntries = [], suggestions = [] } = {}) {
  const hash = crypto.createHash("sha1")
  for (const category of categories) {
    hash.update(`${category.id}:${category.name}:${category.count}\n`)
  }
  hash.update("--entries--\n")
  for (const item of allEntries) {
    hash.update(JSON.stringify(item))
    hash.update("\n")
  }
  hash.update("--suggestions--\n")
  hash.update(String(suggestions.length))
  return hash.digest("hex").slice(0, 20)
}

/**
 * Tulis seluruh konten ke Firestore. Menandai `meta/seedState` sebagai "done"
 * di akhir agar startup berikutnya tidak mengulang penulisan.
 *
 * `skipCategories`: kategori yang isinya sudah diubah manual lewat admin
 * (import) sehingga tidak boleh ditimpa oleh data bawaan.
 */
async function writeContent(
  db,
  { categories, allEntries, suggestions },
  { log = () => {}, fingerprint = "", skipCategories = [] } = {}
) {
  const skip = new Set((skipCategories || []).map(String))
  const writable = categories.filter(category => !skip.has(category.id))
  const seedState = db.collection("meta").doc("seedState")
  let batch = db.batch()
  let ops = 0
  let chunkCount = 0

  try {
    // 1. categories
    for (const category of writable) {
      batch.set(db.collection("categories").doc(category.id), {
        id: category.id,
        name: category.name,
        count: category.count,
        order: category.order
      })
      if (++ops >= BATCH_LIMIT) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }

    // 2. entries (per kategori, di-chunk)
    for (const category of writable) {
      const items = allEntries
        .filter(item => item.__category === category.id)
        .map(({ __category, ...rest }) => rest)
      const chunks = chunkItems(items)
      chunks.forEach((chunk, index) => {
        const docId = `${category.id}__${String(index).padStart(3, "0")}`
        batch.set(db.collection("entries").doc(docId), { category: category.id, index, items: chunk })
        chunkCount++
        ops++
      })
      if (ops >= BATCH_LIMIT) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }

    // 3. meta/catalog + penanda selesai, satu batch terakhir.
    // Kategori yang dilewati (hasil import manual) memakai jumlah entri yang
    // sudah ada di Firestore agar ringkasan katalog tidak mengecil.
    const existingCounts = new Map()
    if (skip.size) {
      const snapshot = await db.collection("meta").doc("catalog").get()
      const existing = snapshot && snapshot.exists ? snapshot.data() : null
      for (const item of (existing && existing.categories) || []) {
        if (item && item.id) existingCounts.set(String(item.id), Number(item.count) || 0)
      }
    }
    const catalogCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      count: skip.has(category.id) && existingCounts.has(category.id) ? existingCounts.get(category.id) : category.count
    }))
    batch.set(db.collection("meta").doc("catalog"), {
      categories: catalogCategories,
      total: catalogCategories.length,
      entryCount: catalogCategories.reduce((sum, item) => sum + Number(item.count || 0), 0),
      sourceFingerprint: fingerprint,
      seeded_at: Date.now()
    })
    batch.set(
      seedState,
      {
        status: "done",
        categories: writable.length,
        entries: allEntries.length,
        chunks: chunkCount,
        localFingerprint: fingerprint,
        at: Date.now()
      },
      { merge: true }
    )
    ops += 2
    if (ops > 0) await batch.commit()

    log(
      `[seed] kategori ditulis: ${writable.length}/${categories.length}` +
        `${skip.size ? ` (dilewati: ${Array.from(skip).join(", ")})` : ""}, chunk entri: ${chunkCount}`
    )

    // 4. saran kata (opsional, bila file ada)
    if (suggestions.length) {
      let sBatch = db.batch()
      let sOps = 0
      for (const item of suggestions) {
        if (!item || !item.id) continue
        sBatch.set(db.collection("word_suggestions").doc(String(item.id)), item, { merge: true })
        if (++sOps >= BATCH_LIMIT) {
          await sBatch.commit()
          sBatch = db.batch()
          sOps = 0
        }
      }
      if (sOps > 0) await sBatch.commit()
      log(`[seed] saran kata ditulis: ${suggestions.length}`)
    }

    return { categories: categories.length, entries: allEntries.length, chunks: chunkCount }
  } catch (error) {
    await seedState
      .set({ status: "error", message: String((error && error.message) || error), at: Date.now() }, { merge: true })
      .catch(() => {})
    throw error
  }
}

module.exports = {
  loadLocalData,
  writeContent,
  contentFingerprint,
  chunkItems,
  ROOT,
  DATA_DIR,
  CHUNK_MAX_BYTES
}
