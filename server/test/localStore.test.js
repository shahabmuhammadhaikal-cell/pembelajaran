const test = require("node:test")
const assert = require("node:assert/strict")
const fsp = require("node:fs/promises")
const os = require("node:os")
const path = require("node:path")
const { createLocalStore } = require("../db/local")

test("akun dapat disimpan, dibaca, dan dihapus dari store JSON", async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "pembelajar-store-"))
  const dataDir = path.join(root, "data")
  await fsp.mkdir(dataDir, { recursive: true })
  try {
    const store = createLocalStore({ rootDir: root, dataDir })
    await store.saveAccount("uid-1", { kids: { stars: 2 }, email: "anak@example.com" })
    const saved = await store.getAccount("uid-1")
    assert.equal(saved.kids.stars, 2)
    assert.equal(saved.email, "anak@example.com")

    await store.deleteAccount("uid-1")
    assert.equal(await store.getAccount("uid-1"), null)
  } finally {
    await fsp.rm(root, { recursive: true, force: true })
  }
})
