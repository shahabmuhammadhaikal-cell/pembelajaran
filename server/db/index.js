/**
 * Pabrik store: memilih Firestore bila kredensial tersedia, selain itu JSON lokal.
 * Mode JSON dipakai development dan tetap berfungsi penuh tanpa Firebase.
 *
 * Sinkronisasi materi:
 * - `assets/data` adalah sumber data lokal (91 kategori, ±12 ribu entri).
 * - Saat startup, server membandingkan sidik jari data lokal dengan
 *   `meta/seedState.localFingerprint` di Firestore, lalu menulis katalog +
 *   entri + saran kata bila berbeda. Jadi kategori/entri baru yang ditambahkan
 *   ke `assets/data` ikut terkirim tanpa perlu menjalankan skrip manual.
 * - Kategori yang datanya pernah diubah manual lewat admin (import) dicatat di
 *   `meta/seedState.manualCategories` dan tidak ditimpa data bawaan.
 * - `AUTO_SEED=0` mematikan seluruh penulisan otomatis ke Firestore.
 * - Bila penulisan gagal, materi sementara dibaca dari `assets/data` agar
 *   aplikasi tidak tampil kosong; akun dan progres tetap di Firestore.
 */
const path = require("path")
const { createLocalStore } = require("./local")
const { createFirestoreStore, isFirestoreConfigured } = require("./firestore")
const { loadLocalData, contentFingerprint } = require("./seedContent")

const ROOT = path.resolve(__dirname, "..", "..")
const DATA_DIR = path.join(ROOT, "assets", "data")

const SEED_RETRY_MS = 30 * 60 * 1000

const CONTENT_FALLBACK_WARNING =
  "Katalog Firestore kosong dan sinkronisasi materi tidak berhasil. Materi dibaca dari assets/data agar aplikasi tidak blank; akun dan progres tetap di Firestore. Cek log server (kredensial Firestore/izin tulis) atau jalankan `node scripts/seed-firestore.js`."

function categoryCount(catalog) {
  return Array.isArray(catalog && catalog.categories) ? catalog.categories.length : 0
}

/** Store Firestore dengan info sumber materi + sinkronisasi ulang atas permintaan. */
function createFirestoreContentStore(firestore, initialCatalog, { manualCategories = [], syncResult = null } = {}) {
  const info = {
    contentSource: "firestore",
    catalogSeeded: true,
    catalogCategories: categoryCount(initialCatalog),
    entryCount: Number((initialCatalog && initialCatalog.entryCount) || 0),
    localFingerprint: (initialCatalog && initialCatalog.sourceFingerprint) || "",
    manualCategories
  }
  if (syncResult && syncResult.seeded) {
    info.seededNow = true
    info.syncedFromLocal = true
  }

  async function refresh(infoExtra) {
    const catalog = await firestore.getCatalog()
    info.catalogCategories = categoryCount(catalog)
    if (catalog && catalog.entryCount !== undefined) info.entryCount = Number(catalog.entryCount) || 0
    if (catalog && catalog.sourceFingerprint) info.localFingerprint = catalog.sourceFingerprint
    Object.assign(info, infoExtra || {})
    return catalog
  }

  return {
    ...firestore,
    /** Paksa bandingkan data lokal dengan Firestore lalu tulis bila berbeda. */
    async syncLocalContent() {
      const result = await syncContent(firestore, { force: true })
      await refresh({
        lastSyncAt: Date.now(),
        lastSyncSkipped: result.skipped || "",
        ...(result.seeded ? { syncedFromLocal: true } : {})
      })
      return result
    },
    healthInfo() {
      return { ...firestore.healthInfo(), ...info }
    }
  }
}

/** Store fallback: materi dari assets/data, data pengguna tetap di Firestore. */
function createContentFallbackStore(primary, content, warning) {
  return {
    ...primary,
    getCatalog: content.getCatalog,
    getEntries: content.getEntries,
    getAllEntries: content.getAllEntries,
    syncLocalContent: async () => ({ ok: false, skipped: "fallback", warning }),
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

/**
 * Bandingkan `assets/data` dengan Firestore, lalu tulis katalog/entri/saran
 * kata bila Firestore masih kosong atau isi lokal berubah.
 *
 * @returns {Promise<{skipped?: string, seeded?: boolean, fingerprint?: string,
 *   categories?: number, entries?: number, chunks?: number, manualCategories?: string[]}>}
 */
async function syncContent(firestore, { env = process.env, data, force = false, log } = {}) {
  if (env.AUTO_SEED === "0") return { skipped: "disabled" }
  if (typeof firestore.seedContent !== "function" || typeof firestore.getSeedState !== "function") {
    return { skipped: "unsupported" }
  }

  const content = data || (await loadLocalData({ rootDir: ROOT, dataDir: DATA_DIR }))
  if (!content.categories.length) {
    console.warn(`[store] assets/data tidak berisi kategori (${DATA_DIR}); sinkronisasi dilewati`)
    return { skipped: "no-local-data" }
  }
  const fingerprint = contentFingerprint(content)

  const state = await firestore.getSeedState().catch(() => null)
  const catalog = await firestore.getCatalog().catch(() => null)
  const total = categoryCount(catalog)
  const done = Boolean(state && state.status === "done")
  const manualCategories = done && Array.isArray(state.manualCategories) ? state.manualCategories : []

  const entryTotal = Number((catalog && catalog.entryCount) || 0)
  if (
    !force &&
    done &&
    state.localFingerprint === fingerprint &&
    total >= content.categories.length &&
    entryTotal >= content.allEntries.length
  ) {
    return { skipped: "up-to-date", fingerprint, manualCategories }
  }

  if (!force && state && state.status === "error" && Date.now() - Number(state.at || 0) < SEED_RETRY_MS) {
    console.warn("[store] sinkronisasi terakhir gagal baru saja; mencoba lagi setelah 30 menit")
    return { skipped: "recent-failure", fingerprint, manualCategories }
  }

  const result = await firestore.seedContent(content, {
    fingerprint,
    skipCategories: manualCategories,
    log: log || (message => console.log(`[store] ${message}`))
  })

  console.log(
    `[store] materi tersinkron ke Firestore: ${result.categories} kategori, ${result.entries} entri, ${result.chunks} chunk` +
      `${manualCategories.length ? `, manual dipertahankan: ${manualCategories.length}` : ""}`
  )
  return { seeded: true, fingerprint, manualCategories, ...result }
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
      let catalog = await firestore.getCatalog()
      let syncResult = null

      if (categoryCount(catalog) === 0 || env.AUTO_SEED !== "0") {
        // Katalog kosong ATAU data lokal berubah: selaraskan dengan assets/data.
        try {
          syncResult = await syncContent(firestore, { env })
        } catch (error) {
          console.warn(`[store] sinkronisasi materi gagal (${error.message})`)
        }
        catalog = await firestore.getCatalog().catch(() => catalog)
      }

      if (categoryCount(catalog) > 0) {
        const state = await firestore.getSeedState().catch(() => null)
        return createFirestoreContentStore(firestore, catalog, {
          manualCategories: state && Array.isArray(state.manualCategories) ? state.manualCategories : [],
          syncResult
        })
      }

      console.warn(`[store] ${CONTENT_FALLBACK_WARNING}`)
      return createContentFallbackStore(firestore, local, CONTENT_FALLBACK_WARNING)
    } catch (error) {
      console.warn(`[store] Firestore gagal dipakai (${error.message}), fallback ke JSON lokal`)
    }
  }

  return local
}

module.exports = {
  createStore,
  syncContent,
  contentFingerprint,
  ROOT,
  DATA_DIR,
  CONTENT_FALLBACK_WARNING
}
