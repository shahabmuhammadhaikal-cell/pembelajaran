const test = require("node:test")
const assert = require("node:assert/strict")
const { mergeAccount } = require("../lib/accountMerge")

test("menggabungkan progres tanpa menghilangkan data", () => {
  const merged = mergeAccount(
    { kids: { stars: 4, learned: { a: 1 }, stickers: {} }, adult: { progress: { favorites: { a: 1 } } } },
    { kids: { stars: 7, learned: { b: 1 } }, adult: { progress: { favorites: { b: 1 } } } }
  )
  assert.equal(merged.kids.profiles.p1.stars, 7)
  assert.deepEqual(merged.kids.profiles.p1.learned, { a: 1, b: 1 })
  assert.deepEqual(merged.adult.progress.favorites, { a: 1, b: 1 })
})

test("reset anak yang lebih baru menang utuh", () => {
  const merged = mergeAccount(
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", stars: 20, learned: { lama: 1 }, resetAt: 1000, name: "A" } }
      }
    },
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", stars: 0, learned: {}, resetAt: 2000, name: "A" } }
      }
    }
  )
  assert.equal(merged.kids.profiles.p1.stars, 0)
  assert.deepEqual(merged.kids.profiles.p1.learned, {})
  assert.equal(merged.kids.profiles.p1.resetAt, 2000)
})

test("reset lokal yang lebih baru tidak dikalahkan data server lama", () => {
  const merged = mergeAccount(
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", stars: 50, learned: { lama: 1 }, resetAt: 3000, name: "A" } }
      }
    },
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", stars: 5, learned: { baru: 1 }, resetAt: 1000, name: "A" } }
      }
    }
  )
  assert.equal(merged.kids.profiles.p1.stars, 50)
  assert.deepEqual(merged.kids.profiles.p1.learned, { lama: 1 })
})

test("tombstone favorit yang lebih baru mengalahkan favorit lama", () => {
  const merged = mergeAccount(
    { adult: { progress: { favorites: { kata: 1000 } } } },
    { adult: { progress: { favorites: { kata: -2000 } } } }
  )
  assert.equal(merged.adult.progress.favorites.kata, -2000)
})

test("perangkat basi tidak bisa menghidupkan favorit yang sudah dihapus", () => {
  const merged = mergeAccount(
    { adult: { progress: { favorites: { kata: -2000 } } } },
    { adult: { progress: { favorites: { kata: 1000 } } } }
  )
  assert.equal(merged.adult.progress.favorites.kata, -2000)
})

test("data anak lama dibungkus menjadi profil dan digabung dengan profil baru", () => {
  const merged = mergeAccount(
    { kids: { stars: 3, learned: { a: 1 } } },
    {
      kids: {
        active: "p2",
        profiles: {
          p2: { id: "p2", name: "Adik", stars: 2, learned: { b: 1 }, resetAt: 0 }
        }
      }
    }
  )
  assert.equal(merged.kids.active, "p2")
  assert.equal(merged.kids.profiles.p1.stars, 3)
  assert.equal(merged.kids.profiles.p2.stars, 2)
})

test("profil anak yang berbeda digabung tanpa saling menimpa", () => {
  const merged = mergeAccount(
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", name: "Kakak", stars: 10, learned: { a: 1 } } }
      }
    },
    {
      kids: {
        active: "p1",
        profiles: { p1: { id: "p1", name: "Kakak", stars: 12, learned: { b: 1 } } }
      }
    }
  )
  assert.equal(merged.kids.profiles.p1.stars, 12)
  assert.deepEqual(merged.kids.profiles.p1.learned, { a: 1, b: 1 })
})

test("reset dewasa yang lebih baru menghapus SRS lama", () => {
  const merged = mergeAccount(
    { adult: { progress: { srs: { kata: { attempts: 3 } }, resetAt: 1000 } } },
    { adult: { progress: { srs: {}, resetAt: 2000 } } }
  )
  assert.deepEqual(merged.adult.progress.srs, {})
  assert.equal(merged.adult.progress.resetAt, 2000)
})
