const test = require("node:test")
const assert = require("node:assert/strict")
const fsp = require("node:fs/promises")
const os = require("node:os")
const path = require("node:path")
const { sanitizeAccountPatch } = require("../lib/accountPayload")
const { mergeAccount } = require("../lib/accountMerge")
const { summarizeAccount } = require("../lib/accountStats")
const { levelFromPoints } = require("../lib/accountLevel")
const { createLocalStore } = require("../db/local")

test("profil akun dibersihkan dan target harian dibatasi", () => {
  const patch = sanitizeAccountPatch({
    profile: {
      name: "  Siti  ",
      avatar: "🦉",
      dailyGoal: 999,
      onboarded: 1,
      leaderboard: "yes",
      familyCode: "HACK01",
      role: "admin"
    }
  })
  assert.equal(patch.profile.name, "Siti")
  assert.equal(patch.profile.avatar, "🦉")
  assert.equal(patch.profile.dailyGoal, 60)
  assert.equal(patch.profile.onboarded, true)
  assert.equal(patch.profile.leaderboard, true)
  // Field sensitif tidak boleh datang dari klien.
  assert.equal(patch.profile.familyCode, undefined)
  assert.equal(patch.profile.role, undefined)
})

test("profil digabung tanpa menghapus field lain", () => {
  const merged = mergeAccount(
    { profile: { name: "Lama", onboarded: true, leaderboard: false } },
    { profile: { name: "Baru" } }
  )
  assert.equal(merged.profile.name, "Baru")
  assert.equal(merged.profile.onboarded, true)
  assert.equal(merged.profile.leaderboard, false)
})

test("tantangan harian yang lebih baru menang", () => {
  const merged = mergeAccount(
    { adult: { progress: { dailyChallenge: { day: "2026-11-21", correct: 9 } } } },
    { adult: { progress: { dailyChallenge: { day: "2026-11-22", correct: 4 } } } }
  )
  assert.equal(merged.adult.progress.dailyChallenge.day, "2026-11-22")
  assert.equal(merged.adult.progress.dailyChallenge.correct, 4)

  const stale = mergeAccount(
    { adult: { progress: { dailyChallenge: { day: "2026-11-22", correct: 9 } } } },
    { adult: { progress: { dailyChallenge: { day: "2026-11-20", correct: 2 } } } }
  )
  assert.equal(stale.adult.progress.dailyChallenge.day, "2026-11-22")
})

test("statistik akun menghitung bintang, kata dikuasai, dan poin", () => {
  const stats = summarizeAccount({
    kids: {
      profiles: {
        p1: { stars: 10, streak: { count: 3 } },
        p2: { stars: 5, streak: { count: 1 } }
      }
    },
    adult: {
      progress: {
        bestStreak: 4,
        favorites: { a: 1, b: 0, c: 12 },
        srs: {
          a: { level: 5, streak: 2, attempts: 3 },
          b: { level: 6, streak: 3, attempts: 2 },
          c: { level: 2, streak: 1, attempts: 5 }
        }
      }
    }
  })
  assert.equal(stats.stars, 15)
  assert.equal(stats.mastered, 2)
  assert.equal(stats.streak, 4)
  assert.equal(stats.favorites, 2)
  assert.equal(stats.attempts, 10)
  assert.equal(stats.points, 15 * 10 + 2 * 5 + 4 * 3)
  assert.equal(stats.level, levelFromPoints(stats.points).level)
})

test("level akun mengikuti ambang poin", () => {
  assert.equal(levelFromPoints(0).level, 1)
  assert.equal(levelFromPoints(149).level, 1)
  assert.equal(levelFromPoints(150).level, 2)
  assert.equal(levelFromPoints(2200).level, 6)
})

test("store JSON mencari akun lewat kode keluarga dan daftar akun", async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "pembelajar-family-"))
  const dataDir = path.join(root, "data")
  await fsp.mkdir(dataDir, { recursive: true })
  try {
    const store = createLocalStore({ rootDir: root, dataDir })
    await store.saveAccount("uid-owner", {
      profile: { name: "Ibu", familyCode: "ABC234" },
      stats: { points: 500 }
    })
    await store.saveAccount("uid-child", {
      profile: { name: "Anak" },
      familyOwner: "uid-owner",
      stats: { points: 80 }
    })
    await store.saveAccount("uid-plain", { profile: { name: "Tamu" } })

    const owner = await store.findAccountByFamilyCode("abc234")
    assert.equal(owner.uid, "uid-owner")

    const child = await store.getAccount("uid-child")
    assert.equal(child.familyOwner, "uid-owner")

    const list = await store.listAccounts(10)
    assert.equal(list.length, 3)

    await store.saveAccount("uid-child", { familyOwner: null })
    const left = await store.getAccount("uid-child")
    assert.equal(left.familyOwner, undefined)
  } finally {
    await fsp.rm(root, { recursive: true, force: true })
  }
})
