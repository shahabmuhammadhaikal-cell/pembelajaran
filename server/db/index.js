/**
 * Pabrik store: memilih Firestore bila kredensial tersedia, selain itu JSON lokal.
 * Mode JSON dipakai development dan tetap berfungsi penuh tanpa Firebase.
 *
 * Saat Firestore aktif tetapi katalognya masih kosong, server mengisi Firestore
 * sendiri dari `assets/data` (auto-seed) memakai kredensial yang sudah ada di
 * server. Set `AUTO_SEED=0` untuk mematikan. Bila auto-seed tidak berhasil,
 * materi sementara dibaca dari `assets/data` agar aplikasi tidak tampil kosong.
 */
const path = require("path")
const { createLocalStore } = require("./local")
const { createFirestoreStore, isFirestoreConfigured } = require("./firestore")
const { loadLocalData } = require("./seedContent")

const ROOT = path.resolve(__dirname, "..", "..")
const DATA_DIR = path.join(ROOT, "assets", "data")

const SEED_RETRY_MS = 30 * 60 * 1000

const CONTENT_FALLBACK_WARNING =
  "Katalog Firestore kosong dan auto-seed tidak berhasil. Materi dibaca dari assets/data agar aplikasi tidak blank; akun dan progres tetap di Firestore. Cek log server (kredensial Firestore/izin tulis) atau jalankan `node scripts/seed-firestore.js`."

/** Ganti fungsi materi dengan versi lokal; data pengguna tetap di store utama. */
function createContentFallbackStore(primary, content, warning) {
  return {
    ...primary,
    getCatalog: content.getCatalog,
    getEntries: content.getEntries,
    getAllEntries: content.getAllEntries,
    healthInfo() {
      return {
        ...primary.healthInfo(),
        contentSource: "assets-json",
        catalogSeeded: false,
        warning
      }
    }
  }
}

function withFirestoreContent(firestore, total, extra = {}) {
  return {
    ...firestore,
    healthInfo() {
      return {
        ...firestore.healthInfo(),
        contentSource: "firestore",
        catalogSeeded: true,
        catalogCategories: total,
        ...extra
      }
    }
  }
}

function categoryCount(catalog) {
  return Array.isArray(catalog && catalog.categories) ? catalog.categories.length : 0
}

/**
 * Isi Firestore dari assets/data bila katalog kosong dan belum pernah berhasil di-seed.
 * Melempar error bila penulisan gagal; pemanggil yang memutuskan fallback.
 */
async function seedIfNeeded(firestore, env) {
  if (env.AUTO_SEED === "0") return { seeded: false, skipped: "disabled" }
  if (typeof firestore.seedContent !== "function") return { seeded: false, skipped: "unsupported" }

  const state = typeof firestore.getSeedState === "function" ? await firestore.getSeedState() : null
  if (state && state.status === "done") return { seeded: false, skipped: "already-seeded" }
  if (state && state.status === "error" && Date.now() - Number(state.at || 0) < SEED_RETRY_MS) {
    console.warn("[store] seed terakhir gagal baru saja; mencoba lagi setelah 30 menit")
    return { seeded: false, skipped: "recent-failure" }
  }

  const data = await loadLocalData({ rootDir: ROOT, dataDir: DATA_DIR })
  if (!data.categories.length) {
    console.warn(`[store] assets/data tidak berisi kategori (${DATA_DIR}); auto-seed dilewati`)
    return { seeded: false, skipped: "no-local-data" }
  }

  const result = await firestore.seedContent(data, { log: message => console.log(`[store] ${message}`) })
  console.log(
    `[store] Firestore di-seed otomatis: ${result.categories} kategori, ${result.entries} entri, ${result.chunks} chunk`
  )
  return { seeded: true, result }
}

async function createStore(env = process.env) {
  const localOptions = { rootDir: ROOT, dataDir: DATA_DIR }
  const local = createLocalStore(localOptions)

  if (env.STORAGE === "json") {
    return local
  }

  if (isFirestoreConfigured(env)) {
    try {
      const firestore = createFirestoreStore(Object.assign({ env }, localOptions))
      // uji koneksi ringan agar kegagalan terlihat di log startup
      const catalog = await firestore.getCatalog()
      const total = categoryCount(catalog)

      if (total > 0) {
        return withFirestoreContent(firestore, total)
      }

      let seededNow = false
      try {
        const { seeded } = await seedIfNeeded(firestore, env)
        seededNow = seeded
      } catch (error) {
        console.warn(`[store] auto-seed gagal (${error.message})`)
      }

      if (seededNow) {
        const fresh = await firestore.getCatalog()
        const freshTotal = categoryCount(fresh)
        if (freshTotal > 0) return withFirestoreContent(firestore, freshTotal, { seededNow: true })
      }

      console.warn(`[store] ${CONTENT_FALLBACK_WARNING}`)
      return createContentFallbackStore(firestore, local, CONTENT_FALLBACK_WARNING)
    } catch (error) {
      console.warn(`[store] Firestore gagal dipakai (${error.message}), fallback ke JSON lokal`)
    }
  }

  return local
}

module.exports = { createStore, ROOT, DATA_DIR, CONTENT_FALLBACK_WARNING }
