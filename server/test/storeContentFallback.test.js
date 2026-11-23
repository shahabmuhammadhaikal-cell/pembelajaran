const test = require("node:test")
const assert = require("node:assert/strict")

const firestoreModulePath = require.resolve("../db/firestore")
const indexModulePath = require.resolve("../db/index")

/** Store Firestore tiruan: cukup untuk menguji pemilihan sumber materi. */
function fakeFirestore({ categories = [] } = {}) {
  return {
    kind: "firestore",
    fromFake: true,
    async getCatalog() {
      return { categories, total: categories.length, fromFake: true }
    },
    async getEntries() {
      return [{ en: "fake" }]
    },
    async getAllEntries() {
      return [{ en: "fake" }]
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

test("katalog Firestore kosong: materi dari assets, data pengguna tetap di Firestore", async () => {
  const createStore = loadCreateStore(fakeFirestore())
  const store = await createStore({})

  const info = store.healthInfo()
  assert.equal(info.storage, "firestore")
  assert.equal(info.contentSource, "assets-json")
  assert.equal(info.catalogSeeded, false)
  assert.match(info.warning, /seed-firestore/)

  const catalog = await store.getCatalog()
  assert.equal(catalog.fromFake, undefined)
  assert.ok(Array.isArray(catalog.categories))

  const account = await store.getAccount("uid-1")
  assert.equal(account.fromFake, true)
})

test("katalog Firestore terisi: materi tetap dari Firestore", async () => {
  const createStore = loadCreateStore(fakeFirestore({ categories: [{ id: "hewan" }] }))
  const store = await createStore({})

  const info = store.healthInfo()
  assert.equal(info.contentSource, "firestore")
  assert.equal(info.catalogSeeded, true)
  assert.equal(info.catalogCategories, 1)

  const catalog = await store.getCatalog()
  assert.equal(catalog.fromFake, true)
})
