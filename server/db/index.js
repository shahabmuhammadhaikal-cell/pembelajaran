/**
 * Pabrik store: memilih Firestore bila kredensial tersedia, selain itu JSON lokal.
 * Mode JSON dipakai development dan tetap berfungsi penuh tanpa Firebase.
 *
 * Bila Firestore aktif tetapi katalognya belum di-seed, materi (katalog/entri)
 * tetap dibaca dari `assets/data` supaya aplikasi tidak tampil kosong, sementara
 * akun, progres, dan saran kata tetap disimpan di Firestore.
 */
const path = require("path")
const { createLocalStore } = require("./local")
const { createFirestoreStore, isFirestoreConfigured } = require("./firestore")

const ROOT = path.resolve(__dirname, "..", "..")
const DATA_DIR = path.join(ROOT, "assets", "data")

const CONTENT_FALLBACK_WARNING =
  "Katalog Firestore kosong (belum di-seed). Materi dibaca dari assets/data agar aplikasi tidak blank; akun dan progres tetap di Firestore. Jalankan `node scripts/seed-firestore.js` lalu restart server."

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
      const total = Array.isArray(catalog && catalog.categories) ? catalog.categories.length : 0

      if (total > 0) {
        return {
          ...firestore,
          healthInfo() {
            return {
              ...firestore.healthInfo(),
              contentSource: "firestore",
              catalogSeeded: true,
              catalogCategories: total
            }
          }
        }
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
