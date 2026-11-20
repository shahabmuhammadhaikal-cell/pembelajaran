import test from "node:test"
import assert from "node:assert/strict"
import { mergeAdultProgress } from "../src/lib/progressMerge.js"

test("reset dewasa yang lebih baru menang utuh", () => {
  const merged = mergeAdultProgress(
    { srs: { kata: { attempts: 3 } }, favorites: { kata: 1 }, resetAt: 1000 },
    { srs: {}, favorites: {}, resetAt: 2000 }
  )
  assert.deepEqual(merged.srs, {})
  assert.deepEqual(merged.favorites, {})
})

test("reset lokal yang lebih baru tidak dikalahkan data server lama", () => {
  const merged = mergeAdultProgress(
    { srs: {}, favorites: {}, resetAt: 3000 },
    { srs: { kata: { attempts: 3 } }, favorites: { kata: 1 }, resetAt: 1000 }
  )
  assert.deepEqual(merged.srs, {})
  assert.deepEqual(merged.favorites, {})
})

test("tombstone favorit yang lebih baru menang atas favorit lama", () => {
  const merged = mergeAdultProgress({ favorites: { kata: 1000 } }, { favorites: { kata: -2000 } })
  assert.equal(merged.favorites.kata, -2000)
})

test("perangkat basi tidak menghidupkan favorit yang sudah dihapus", () => {
  const merged = mergeAdultProgress({ favorites: { kata: -2000 } }, { favorites: { kata: 1000 } })
  assert.equal(merged.favorites.kata, -2000)
})

test("penghitung tidak turun saat digabung", () => {
  const merged = mergeAdultProgress(
    { bestDaily: 10, streak: 4, lastStudy: 500, completedToday: 6 },
    { bestDaily: 7, streak: 2, lastStudy: 900, completedToday: 8 }
  )
  assert.equal(merged.bestDaily, 10)
  assert.equal(merged.streak, 4)
  assert.equal(merged.lastStudy, 900)
  assert.equal(merged.completedToday, 8)
})
