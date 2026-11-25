import test from "node:test"
import assert from "node:assert/strict"
import {
  kidsDocHasProgress,
  mergeKids,
  mergeKidsDoc,
  normalizeKidsDoc,
  stripResetTimestamps
} from "../src/lib/kidsMerge.js"

test("progres anak lama dibungkus menjadi profil p1", () => {
  const doc = normalizeKidsDoc({ stars: 4, learned: { a: 1 } })
  assert.equal(doc.active, "p1")
  assert.equal(doc.profiles.p1.stars, 4)
})

test("reset dari akun yang lebih baru menang", () => {
  const merged = mergeKids(
    { stars: 30, learned: { lama: 1 }, resetAt: 1000 },
    { stars: 0, learned: {}, resetAt: 2000 }
  )
  assert.equal(merged.stars, 0)
  assert.deepEqual(merged.learned, {})
})

test("reset lokal yang lebih baru tidak dibatalkan data lama", () => {
  const merged = mergeKids(
    { stars: 0, learned: {}, resetAt: 2000 },
    { stars: 30, learned: { lama: 1 }, resetAt: 1000 }
  )
  assert.equal(merged.stars, 0)
  assert.deepEqual(merged.learned, {})
})

test("dokumen profil menggabungkan profil yang sama dan mempertahankan profil aktif lokal", () => {
  const local = {
    active: "p1",
    profiles: {
      p1: { id: "p1", name: "Kakak", stars: 5, learned: { a: 1 } },
      p2: { id: "p2", name: "Adik", stars: 1 }
    }
  }
  const remote = {
    active: "p2",
    profiles: {
      p1: { id: "p1", name: "Kakak", stars: 8, learned: { b: 1 } }
    }
  }
  const merged = mergeKidsDoc(local, remote)
  assert.equal(merged.active, "p1")
  assert.equal(merged.profiles.p1.stars, 8)
  assert.deepEqual(merged.profiles.p1.learned, { a: 1, b: 1 })
  assert.equal(merged.profiles.p2.name, "Adik")
})

test("menggabungkan profil p2 tidak mengubah id profil", () => {
  const merged = mergeKids(
    { id: "p2", name: "Adik", stars: 2, learned: { a: 1 } },
    { id: "p2", name: "Adik", stars: 3, learned: { b: 1 } }
  )
  assert.equal(merged.id, "p2")
  assert.deepEqual(merged.learned, { a: 1, b: 1 })
})

test("dokumen bawaan yang kosong terdeteksi", () => {
  assert.equal(kidsDocHasProgress(normalizeKidsDoc(null)), false)
  assert.equal(kidsDocHasProgress({ stars: 0, learned: {} }), false)
  assert.equal(kidsDocHasProgress({ stars: 0, learned: {}, resetAt: 123 }), true)
  assert.equal(kidsDocHasProgress({ stars: 2, learned: {} }), true)
})

test("penanda reset tamu bisa dihapus sebelum digabung ke akun", () => {
  const stripped = stripResetTimestamps({
    active: "p1",
    profiles: { p1: { id: "p1", stars: 0, resetAt: 5000 } }
  })
  assert.equal(stripped.profiles.p1.resetAt, 0)
})

test("kata sulit digabung dengan hitungan terbesar", () => {
  const merged = mergeKids(
    { mistakes: { "animals:cat": { count: 2, at: 10 } } },
    { mistakes: { "animals:cat": { count: 5, at: 20 }, "food:fd-rice": { count: 1, at: 5 } } }
  )
  assert.equal(merged.mistakes["animals:cat"].count, 5)
  assert.equal(merged.mistakes["animals:cat"].at, 20)
  assert.equal(merged.mistakes["food:fd-rice"].count, 1)
})

test("profil baru dari akun ikut ditambahkan", () => {
  const merged = mergeKidsDoc(
    { active: "p1", profiles: { p1: { id: "p1", name: "Kakak", stars: 2 } } },
    { active: "p9", profiles: { p9: { id: "p9", name: "Adik", stars: 3 } } }
  )
  assert.equal(merged.profiles.p9.stars, 3)
  assert.equal(merged.active, "p1")
})
