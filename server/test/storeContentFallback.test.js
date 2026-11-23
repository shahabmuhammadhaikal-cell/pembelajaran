const test = require("node:test")
const assert = require("node:assert/strict")

const firestoreModulePath = require.resolve("../db/firestore")
const indexModulePath = require.resolve("../db/index")

/** Store Firestore tiruan: cukup untuk menguji pemilihan sumber materi dan auto-seed. */
function fakeFirestore({ categories = [], seedError = null } = {}) {
  const state = { categories: categories.slice(), seedAttempts: 0 }
  const store = {
    kind: "firestore",
    fromFake: true,
    seedAttempts: () => state.seedAttempts,
    async getCatalog() {
      return { categories: state.categories, total: state.categories.length, fromFake: true }
    },
    async getEntries() {
      return [{ en: "fake" }]
    },
    async getAllEntries() {
      return [{ en: "fake" }]
    },
    async getSeedState() {
      return null
    },
    async seedContent(data) {
      state.seedAttempts++
      if (seedError) throw seedError
      state.categories = data.categories.map(category => ({ id: category.id }))
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

test("katalog Firestore terisi: materi tetap dari Firestore", async () => {
  const store = fakeFirestore({ categories: [{ id: "hewan" }] })
  const createStore = loadCreateStore(store)
  const result = await createStore({})

  assert.equal(store.seedAttempts(), 0)

  const info = result.healthInfo()
  assert.equal(info.contentSource, "firestore")
  assert.equal(info.catalogSeeded, true)
  assert.equal(info.catalogCategories, 1)
  assert.equal(info.seededNow, undefined)

  const catalog = await result.getCatalog()
  assert.equal(catalog.fromFake, true)
})
