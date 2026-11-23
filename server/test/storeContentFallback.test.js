const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const fsp = require("node:fs/promises")
const os = require("node:os")
const path = require("node:path")

const { loadLocalData, contentFingerprint } = require("../db/seedContent")
const { createLocalStore } = require("../db/local")

const firestoreModulePath = require.resolve("../db/firestore")
const indexModulePath = require.resolve("../db/index")

/** Store Firestore tiruan: cukup untuk menguji pemilihan sumber materi dan sinkronisasi. */
function fakeFirestore({ categories = [], entryCount = 0, seedError = null, seedState = null } = {}) {
  const state = { categories: categories.slice(), entryCount, seedAttempts: 0, lastOptions: null }
  const store = {
    kind: "firestore",
    fromFake: true,
    seedAttempts: () => state.seedAttempts,
    seedOptions: () => state.lastOptions,
    async getCatalog() {
      return {
        categories: state.categories,
        total: state.categories.length,
        entryCount: state.entryCount,
        fromFake: true
      }
    },
    async getEntries() {
      return [{ en: "fake" }]
    },
    async getAllEntries() {
      return [{ en: "fake" }]
    },
    async getSeedState() {
      return seedState
    },
    async seedContent(data, options) {
      state.seedAttempts++
      state.lastOptions = options
      if (seedError) throw seedError
      state.categories = data.categories.map(category => ({ id: category.id }))
      state.entryCount = data.allEntries.length
      return { categories: state.categories.length, entries: data.allEntries.length, chunks: 1 }
    },
    async getAccount(uid) {
      return { uid, fromFake: true }
    },
    async saveAccount() {
      return {}
    },
    async listAccounts() {
      return []
    },
    async findAccountByFamilyCode() {
      return null
    },
    async deleteAccount() {
      return true
    },
    async getProgress() {
      return null
    },
    async saveProgress() {
      return {}
    },
    async listSuggestions() {
      return []
    },
    async saveSuggestions() {
      return []
    },
    healthInfo() {
      return { storage: "firestore", projectId: "demo" }
    }
  }
  return store
}

/** Muat ulang db/index dengan modul Firestore yang diganti store tiruan. */
function loadCreateStore(store) {
  const previous = require.cache[firestoreModulePath]
  require.cache[firestoreModulePath] = {
    id: firestoreModulePath,
    filename: firestoreModulePath,
    loaded: true,
    exports: {
      isFirestoreConfigured: () => true,
      createFirestoreStore: () => store
    }
  }
  delete require.cache[indexModulePath]
  const { createStore } = require("../db/index")
  delete require.cache[indexModulePath]
  if (previous) require.cache[firestoreModulePath] = previous
  else delete require.cache[firestoreModulePath]
  return createStore
}

test("katalog Firestore kosong: auto-seed mengisi Firestore dari assets", async () => {
  const store = fakeFirestore()
  const createStore = loadCreateStore(store)
  const result = await createStore({})

  assert.equal(store.seedAttempts(), 1)

  const info = result.healthInfo()
  assert.equal(info.storage, "firestore")
  assert.equal(info.contentSource, "firestore")
  assert.equal(info.catalogSeeded, true)
  assert.equal(info.seededNow, true)
  assert.ok(info.catalogCategories > 0, "katalog seharusnya berisi kategori hasil seed")

  const catalog = await result.getCatalog()
  assert.equal(catalog.fromFake, true)
  assert.ok(Array.isArray(catalog.categories) && catalog.categories.length > 0)
})

test("katalog Firestore kosong dan auto-seed gagal: materi dari assets, data pengguna tetap di Firestore", async () => {
  const store = fakeFirestore({ seedError: new Error("permission denied") })
  const createStore = loadCreateStore(store)
  const result = await createStore({})

  assert.equal(store.seedAttempts(), 1)

  const info = result.healthInfo()
  assert.equal(info.storage, "firestore")
  assert.equal(info.contentSource, "assets-json")
  assert.equal(info.catalogSeeded, false)
  assert.match(info.warning, /seed/)

  const catalog = await result.getCatalog()
  assert.equal(catalog.fromFake, undefined)
  assert.ok(Array.isArray(catalog.categories))

  const account = await result.getAccount("uid-1")
  assert.equal(account.fromFake, true)
})

test("AUTO_SEED=0 melewati auto-seed dan memakai materi assets", async () => {
  const store = fakeFirestore()
  const createStore = loadCreateStore(store)
  const result = await createStore({ AUTO_SEED: "0" })

  assert.equal(store.seedAttempts(), 0)
  assert.equal(result.healthInfo().contentSource, "assets-json")
})

test("katalog Firestore terisi dan data lokal sama: tidak menulis ulang", async () => {
  const local = await loadLocalData()
  const fingerprint = contentFingerprint(local)
  const store = fakeFirestore({
    categories: local.categories.slice(),
    entryCount: local.allEntries.length,
    seedState: { status: "done", localFingerprint: fingerprint, categories: local.categories.length }
  })
  const createStore = loadCreateStore(store)
  const result = await createStore({})

  assert.equal(store.seedAttempts(), 0)

  const info = result.healthInfo()
  assert.equal(info.contentSource, "firestore")
  assert.equal(info.catalogSeeded, true)
  assert.equal(info.catalogCategories, local.categories.length)
  assert.equal(info.seededNow, undefined)

  const catalog = await result.getCatalog()
  assert.equal(catalog.fromFake, true)
})

test("data lokal berubah: kategori/entri baru ikut disinkronkan ke Firestore", async () => {
  const local = await loadLocalData()
  const store = fakeFirestore({
    categories: [{ id: "greetings" }, { id: "animals" }],
    seedState: {
      status: "done",
      localFingerprint: "fingerprint-lama",
      categories: 2,
      manualCategories: ["animals"]
    }
  })
  const createStore = loadCreateStore(store)
  const result = await createStore({})

  assert.equal(store.seedAttempts(), 1)
  assert.deepEqual(store.seedOptions().skipCategories, ["animals"])
  assert.equal(store.seedOptions().fingerprint, contentFingerprint(local))

  assert.equal(result.healthInfo().contentSource, "firestore")
  assert.equal(result.healthInfo().catalogCategories, local.categories.length)
  assert.deepEqual(result.healthInfo().manualCategories, ["animals"])
})

test("store lokal menyimpan entri hasil import manual ke file kategori", async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "pembelajar-manual-"))
  const dataDir = path.join(root, "assets", "data")
  await fsp.mkdir(path.join(dataDir, "categories"), { recursive: true })
  await fsp.writeFile(
    path.join(dataDir, "catalog.json"),
    JSON.stringify({ categories: [{ id: "animals", name: "Hewan" }] })
  )
  await fsp.mkdir(path.join(root, "assets", "animals"), { recursive: true })
  await fsp.writeFile(path.join(root, "assets", "animals", "animals.json"), JSON.stringify([{ en: "Cat" }]))

  try {
    const store = createLocalStore({ rootDir: root, dataDir })
    await store.setCategoryEntries("animals", [{ en: "Cat" }, { en: "Dog" }], { manual: true })

    const saved = JSON.parse(
      fs.readFileSync(path.join(root, "assets", "animals", "animals.json"), "utf8")
    )
    assert.equal(saved.length, 2)
    assert.deepEqual(await store.getEntries("animals"), saved)
  } finally {
    await fsp.rm(root, { recursive: true, force: true })
  }
})
