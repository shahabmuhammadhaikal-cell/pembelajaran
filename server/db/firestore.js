/**
 * Firestore store (firebase-admin).
 *
 * Dipakai saat kredensial Firebase tersedia (misalnya production di Render).
 * Skema:
 *   categories/{categoryId}      -> { id, name, order, count }
 *   entries/{categoryId}__{n}    -> { category, index, items: [...] }   (dibagi chunk agar < 1MB)
 *   word_suggestions/{id}        -> entri saran kata
 *   progress/{deviceId}          -> { deviceId, data, updated_at }
 *   meta/catalog                 -> ringkasan kategori (dibuat oleh seed)
 */

const { writeContent, chunkItems, CHUNK_MAX_BYTES } = require("./seedContent")
const BATCH_LIMIT = 400

function isFirestoreConfigured(env = process.env) {
  if (env.FIRESTORE_EMULATOR_HOST) return true
  if (env.FIREBASE_SERVICE_ACCOUNT || env.FIREBASE_SERVICE_ACCOUNT_JSON) return true
  if (env.GOOGLE_APPLICATION_CREDENTIALS) return true
  if (env.GOOGLE_APPLICATION_CREDENTIALS_JSON && env.FIREBASE_PROJECT_ID) return true
  return false
}

function parseServiceAccount(env = process.env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT || env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  if (!raw) return null
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8")
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT bukan JSON valid: ${error.message}`)
  }
}

/** Inisialisasi firebase-admin sekali saja; dipakai store dan verifikasi login. */
function ensureAdmin(env = process.env) {
  const admin = require("firebase-admin")
  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount(env)
    const config = serviceAccount
      ? { credential: admin.credential.cert(serviceAccount), projectId: serviceAccount.project_id }
      : env.GOOGLE_APPLICATION_CREDENTIALS_JSON && env.FIREBASE_PROJECT_ID
        ? {
            credential: admin.credential.cert(JSON.parse(
              Buffer.from(env.GOOGLE_APPLICATION_CREDENTIALS_JSON, "base64").toString("utf8")
            )),
            projectId: env.FIREBASE_PROJECT_ID
          }
        : { projectId: env.FIREBASE_PROJECT_ID || undefined }
    admin.initializeApp(config)
  }
  return admin
}

function createFirestoreStore({ env = process.env, rootDir, dataDir } = {}) {
  const admin = ensureAdmin(env)
  const db = admin.firestore()
  const cache = new Map()

  const COLLECTIONS = {
    categories: "categories",
    entries: "entries",
    suggestions: "word_suggestions",
    progress: "progress",
    users: "users",
    meta: "meta"
  }

  async function getCatalog() {
    if (cache.has("catalog")) return cache.get("catalog")
    const meta = await db.collection(COLLECTIONS.meta).doc("catalog").get()
    if (meta.exists) {
      const value = meta.data()
      cache.set("catalog", value)
      return value
    }
    const snapshot = await db.collection(COLLECTIONS.categories).orderBy("order").get()
    const categories = snapshot.docs.map(doc => {
      const data = doc.data()
      return { id: data.id || doc.id, name: data.name || doc.id, count: Number(data.count || 0) }
    })
    const value = { categories, total: categories.length }
    cache.set("catalog", value)
    return value
  }

  async function getEntries(categoryId) {
    const safe = String(categoryId || "").replace(/[^a-z0-9_]+/gi, "")
    if (!safe) return []
    const key = `entries:${safe}`
    if (cache.has(key)) return cache.get(key)
    // tanpa orderBy agar tidak butuh composite index Firestore
    const snapshot = await db
      .collection(COLLECTIONS.entries)
      .where("category", "==", safe)
      .get()
    const items = []
    snapshot.docs
      .sort((a, b) => Number(a.data().index || 0) - Number(b.data().index || 0))
      .forEach(doc => {
        const chunk = doc.data().items || []
        for (const item of chunk) items.push(item)
      })
    cache.set(key, items)
    return items
  }

  async function getAllEntries() {
    const catalog = await getCatalog()
    const out = []
    for (const category of catalog.categories || []) {
      const items = await getEntries(category.id)
      for (const item of items) out.push(item)
    }
    return out
  }

  async function listSuggestions() {
    const snapshot = await db.collection(COLLECTIONS.suggestions).orderBy("ts", "desc").limit(500).get()
    return snapshot.docs.map(doc => doc.data())
  }

  async function saveSuggestions(items) {
    const incoming = Array.isArray(items) ? items : []
    const snapshot = await db.collection(COLLECTIONS.suggestions).limit(500).get()
    const existingIds = new Set(snapshot.docs.map(doc => doc.id))
    const incomingIds = new Set(incoming.map(item => String(item.id)))

    const collection = db.collection(COLLECTIONS.suggestions)
    const ops = []
    for (const id of existingIds) {
      if (!incomingIds.has(id)) ops.push({ kind: "delete", ref: collection.doc(id) })
    }
    for (const item of incoming) {
      ops.push({ kind: "set", ref: collection.doc(String(item.id)), data: item })
    }

    // Firestore batch dibatasi 500 operasi per batch.
    for (let i = 0; i < ops.length; i += 400) {
      const batch = db.batch()
      for (const op of ops.slice(i, i + 400)) {
        if (op.kind === "delete") batch.delete(op.ref)
        else batch.set(op.ref, op.data, { merge: true })
      }
      await batch.commit()
    }
    return items
  }

  async function getProgress(deviceId) {
    const key = String(deviceId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
    if (!key) return null
    const doc = await db.collection(COLLECTIONS.progress).doc(key).get()
    if (!doc.exists) return null
    const data = doc.data()
    return data.payload || null
  }

  async function saveProgress(deviceId, payload) {
    const key = String(deviceId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
    if (!key) throw new Error("deviceId is required")
    await db.collection(COLLECTIONS.progress).doc(key).set({
      deviceId: key,
      payload,
      updated_at: Date.now()
    }, { merge: true })
    return payload
  }

  async function getAccount(uid) {
    const key = String(uid || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128)
    if (!key) return null
    const doc = await db.collection(COLLECTIONS.users).doc(key).get()
    return doc.exists ? doc.data() : null
  }

  async function saveAccount(uid, patch) {
    const key = String(uid || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128)
    if (!key) throw new Error("uid is required")
    const data = { uid: key, updated_at: Date.now() }
    if (patch && typeof patch === "object") {
      if (patch.kids && typeof patch.kids === "object") data.kids = patch.kids
      if (patch.adult && typeof patch.adult === "object") data.adult = patch.adult
      if (patch.profile && typeof patch.profile === "object") data.profile = patch.profile
      if (patch.stats && typeof patch.stats === "object") data.stats = patch.stats
      if (patch.role) data.role = String(patch.role).slice(0, 20)
      if (patch.email) data.email = String(patch.email).slice(0, 200)
      if (patch.familyOwner !== undefined) {
        data.familyOwner = patch.familyOwner
          ? String(patch.familyOwner).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128)
          : admin.firestore.FieldValue.delete()
      }
    }
    await db.collection(COLLECTIONS.users).doc(key).set(data, { merge: true })
    return data
  }

  /** Akun untuk papan peringkat: hanya yang punya stats.points. */
  async function listAccounts(limit = 100) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100))
    try {
      const snapshot = await db
        .collection(COLLECTIONS.users)
        .orderBy("stats.points", "desc")
        .limit(safeLimit)
        .get()
      return snapshot.docs.map(doc => doc.data())
    } catch {
      const snapshot = await db.collection(COLLECTIONS.users).limit(safeLimit).get()
      return snapshot.docs.map(doc => doc.data())
    }
  }

  async function findAccountByFamilyCode(code) {
    const clean = String(code || "").trim().toUpperCase()
    if (!/^[A-Z0-9]{4,10}$/.test(clean)) return null
    const snapshot = await db
      .collection(COLLECTIONS.users)
      .where("profile.familyCode", "==", clean)
      .limit(1)
      .get()
    if (snapshot.empty) return null
    return snapshot.docs[0].data()
  }

  async function deleteAccount(uid) {
    const key = String(uid || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 128)
    if (!key) return false
    await db.collection(COLLECTIONS.users).doc(key).delete()
    return true
  }

  async function getSeedState() {
    const doc = await db.collection(COLLECTIONS.meta).doc("seedState").get()
    return doc.exists ? doc.data() : null
  }

  /** Tulis konten dari assets/data ke Firestore; cache dikosongkan agar data baru terbaca. */
  async function seedContent(data, options) {
    const result = await writeContent(db, data, options)
    cache.clear()
    return result
  }

  /**
   * Ganti seluruh entri satu kategori (dipakai import data manual dari admin),
   * lalu selaraskan `categories/{id}` dan `meta/catalog`. Kategori yang diubah
   * manual dicatat di `meta/seedState.manualCategories` supaya sinkronisasi
   * berikutnya tidak menimpa hasil suntingan dengan data bawaan.
   */
  async function setCategoryEntries(categoryId, items, { manual = true } = {}) {
    const safe = String(categoryId || "").replace(/[^a-z0-9_]+/gi, "")
    if (!safe) throw new Error("categoryId is required")
    const list = Array.isArray(items) ? items : []

    const categoryRef = db.collection(COLLECTIONS.categories).doc(safe)
    const categoryDoc = await categoryRef.get()
    if (!categoryDoc.exists) throw new Error(`Kategori ${safe} belum ada di katalog Firestore`)

    const entriesRef = db.collection(COLLECTIONS.entries)
    const existing = await entriesRef.where("category", "==", safe).get()

    let batch = db.batch()
    let ops = 0
    const flush = async () => {
      if (!ops) return
      await batch.commit()
      batch = db.batch()
      ops = 0
    }

    for (const doc of existing.docs) {
      batch.delete(doc.ref)
      if (++ops >= BATCH_LIMIT) await flush()
    }

    for (const [index, chunk] of chunkItems(list, CHUNK_MAX_BYTES).entries()) {
      batch.set(entriesRef.doc(`${safe}__${String(index).padStart(3, "0")}`), {
        category: safe,
        index,
        items: chunk
      })
      if (++ops >= BATCH_LIMIT) await flush()
    }
    await flush()

    await categoryRef.set(
      { id: safe, count: list.length, manual: Boolean(manual), updated_at: Date.now() },
      { merge: true }
    )

    const seedStateRef = db.collection(COLLECTIONS.meta).doc("seedState")
    const seedState = await getSeedState()
    const manualCategories = new Set(
      (seedState && Array.isArray(seedState.manualCategories) ? seedState.manualCategories : []).map(String)
    )
    if (manual) manualCategories.add(safe)
    await seedStateRef.set(
      { manualCategories: Array.from(manualCategories), updated_at: Date.now() },
      { merge: true }
    )

    const catalogRef = db.collection(COLLECTIONS.meta).doc("catalog")
    const catalogDoc = await catalogRef.get()
    if (catalogDoc.exists) {
      const catalog = catalogDoc.data()
      const current = categoryDoc.data().name
      const categories = (Array.isArray(catalog.categories) ? catalog.categories : []).map(item =>
        item.id === safe ? { ...item, name: current || item.name, id: safe, count: list.length } : item
      )
      if (!categories.some(item => item.id === safe)) {
        categories.push({ id: safe, name: current || safe, count: list.length })
      }
      await catalogRef.set(
        {
          categories,
          total: categories.length,
          entryCount: categories.reduce((sum, item) => sum + Number(item.count || 0), 0),
          updated_at: Date.now()
        },
        { merge: true }
      )
    }

    cache.clear()
    return { category: safe, entries: list.length, chunks: chunkItems(list, CHUNK_MAX_BYTES).length }
  }

  function healthInfo() {
    return {
      storage: "firestore",
      projectId: admin.app().options.projectId || "",
      emulator: !!env.FIRESTORE_EMULATOR_HOST
    }
  }

  return {
    kind: "firestore",
    getCatalog,
    getEntries,
    getAllEntries,
    listSuggestions,
    saveSuggestions,
    getSeedState,
    seedContent,
    setCategoryEntries,
    getProgress,
    saveProgress,
    getAccount,
    saveAccount,
    listAccounts,
    findAccountByFamilyCode,
    deleteAccount,
    healthInfo
  }
}

module.exports = { createFirestoreStore, isFirestoreConfigured, parseServiceAccount, ensureAdmin }
