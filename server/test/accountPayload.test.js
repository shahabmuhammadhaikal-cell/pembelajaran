const test = require("node:test")
const assert = require("node:assert/strict")
const { sanitizeAccountPatch, MAX_PROFILES } = require("../lib/accountPayload")

test("progres anak lama dinormalisasi menjadi dokumen profil", () => {
  const patch = sanitizeAccountPatch({
    kids: { stars: 5, learned: { a: 1 }, name: "Anak" }
  })
  assert.equal(patch.kids.active, "p1")
  assert.equal(patch.kids.profiles.p1.stars, 5)
  assert.equal(patch.kids.profiles.p1.name, "Anak")
})

test("jumlah profil dibatasi", () => {
  const profiles = {}
  for (let index = 0; index < 10; index += 1) {
    profiles[`p${index}`] = { id: `p${index}`, stars: index }
  }
  const patch = sanitizeAccountPatch({ kids: { active: "p0", profiles } })
  assert.equal(Object.keys(patch.kids.profiles).length, MAX_PROFILES)
})

test("field asing dan nilai berbahaya dibuang", () => {
  const patch = sanitizeAccountPatch({
    kids: {
      active: "p1",
      profiles: {
        p1: { id: "p1", stars: 3, script: "<script>", learned: { ok: 1, __proto__: 2 } }
      }
    },
    adult: { progress: { favorites: { kata: 1, lain: 0 }, srs: { x: { attempts: 2, evil: 1 } }, unknown: 1 } }
  })
  assert.equal(patch.kids.profiles.p1.script, undefined)
  assert.equal(Object.prototype.hasOwnProperty.call(patch.kids.profiles.p1.learned, "__proto__"), false)
  assert.equal(patch.kids.profiles.p1.learned.ok, 1)
  assert.deepEqual(patch.adult.progress.favorites, { kata: 1, lain: 0 })
  assert.equal(patch.adult.progress.srs.x.evil, undefined)
  assert.equal(patch.adult.progress.unknown, undefined)
})

test("payload terlalu besar ditolak dengan status 413", () => {
  assert.throws(
    () => sanitizeAccountPatch({ adult: { progress: { dayStamp: "x".repeat(300 * 1024) } } }),
    error => error.status === 413
  )
})

test("payload tanpa kids/adult ditolak", () => {
  assert.throws(() => sanitizeAccountPatch({ foo: 1 }), error => error.status === 422)
})

test("riwayat dan daftar kuis dipangkas", () => {
  const patch = sanitizeAccountPatch({
    adult: {
      progress: {
        quizErrors: Array.from({ length: 200 }, (_, index) => ({ key: String(index), ts: index })),
        translateHistory: Array.from({ length: 50 }, (_, index) => ({ text: String(index) }))
      }
    }
  })
  assert.equal(patch.adult.progress.quizErrors.length, 60)
  assert.equal(patch.adult.progress.translateHistory.length, 20)
})
