const test = require("node:test")
const assert = require("node:assert/strict")
const { createAccountDeletion } = require("../lib/accountDeletion")
const { createDeletionTickets } = require("../lib/deletionTicket")

function fakeRes() {
  const res = { statusCode: 200, headers: {} }
  res.set = (name, value) => {
    res.headers[name] = value
    return res
  }
  res.status = code => {
    res.statusCode = code
    return res
  }
  res.json = body => {
    res.body = body
    return res
  }
  return res
}

function setup(overrides = {}) {
  const calls = { deleteAccount: [], deleteAuthUser: [] }
  const tickets = createDeletionTickets({ ttlMs: 60_000 })
  const app = createAccountDeletion({
    tickets,
    verifyPassword: async () => true,
    verifyGoogleIdToken: async () => true,
    deleteAccount: async uid => {
      calls.deleteAccount.push(uid)
    },
    deleteAuthUser: async uid => {
      calls.deleteAuthUser.push(uid)
    },
    allowAttempt: () => true,
    env: { FIREBASE_WEB_API_KEY: "key", GOOGLE_OAUTH_CLIENT_ID: "client" },
    ...overrides
  })
  return { app, tickets, calls }
}

test("password salah: tidak ada tiket dan API hapus tidak pernah dipanggil", async () => {
  const { app, tickets, calls } = setup({
    verifyPassword: async () => {
      const error = new Error("Password salah. Penghapusan dibatalkan.")
      error.code = "reauth_failed"
      error.status = 401
      throw error
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "salah" } },
    res
  )

  assert.equal(res.statusCode, 401)
  assert.equal(res.body.code, "reauth_failed")
  assert.equal(res.body.ticket, undefined)
  assert.equal(tickets.size(), 0)

  const deleteRes = fakeRes()
  await app.deleteAccount({ user: { uid: "uid-1" }, headers: {} }, deleteRes)
  assert.equal(deleteRes.statusCode, 403)
  assert.deepEqual(calls.deleteAccount, [])
  assert.deepEqual(calls.deleteAuthUser, [])
})

test("verifikasi Google gagal: tanpa tiket dan tanpa penghapusan", async () => {
  const { app, tickets, calls } = setup({
    verifyGoogleIdToken: async () => {
      const error = new Error("Verifikasi Google gagal. Penghapusan dibatalkan.")
      error.code = "reauth_failed"
      error.status = 401
      throw error
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "google", googleIdToken: "x" } },
    res
  )

  assert.equal(res.statusCode, 401)
  assert.equal(tickets.size(), 0)
  assert.deepEqual(calls.deleteAccount, [])
})

test("verifikasi error tak terduga dijawab 500 tanpa tiket", async () => {
  const { app, tickets } = setup({
    verifyPassword: async () => {
      throw new Error("boom")
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "x" } },
    res
  )
  assert.equal(res.statusCode, 500)
  assert.equal(tickets.size(), 0)
})

test("metode tidak dikenal ditolak tanpa memakai kuota percobaan", async () => {
  let attempts = 0
  const { app, tickets } = setup({
    allowAttempt: () => {
      attempts += 1
      return true
    }
  })
  const res = fakeRes()
  await app.requestTicket({ user: { uid: "uid-1", email: "a@example.com" }, body: {} }, res)

  assert.equal(res.statusCode, 400)
  assert.equal(attempts, 0)
  assert.equal(tickets.size(), 0)
})

test("akun tanpa email tidak bisa memverifikasi apa pun", async () => {
  let verified = false
  const { app, tickets } = setup({
    verifyPassword: async () => {
      verified = true
      return true
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "" }, body: { method: "password", password: "x" } },
    res
  )

  assert.equal(res.statusCode, 400)
  assert.equal(verified, false)
  assert.equal(tickets.size(), 0)
})

test("kuota habis: verifikasi tidak dijalankan dan tidak ada tiket", async () => {
  let verified = false
  const { app, tickets } = setup({
    allowAttempt: () => false,
    verifyPassword: async () => {
      verified = true
      return true
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "x" } },
    res
  )

  assert.equal(res.statusCode, 429)
  assert.equal(res.headers["Retry-After"], "900")
  assert.equal(verified, false)
  assert.equal(tickets.size(), 0)
})

test("verifikasi berhasil: tiket sekali pakai menghapus akun tepat satu kali", async () => {
  const { app, calls } = setup()
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "benar" } },
    res
  )

  assert.equal(res.statusCode, 200)
  assert.equal(typeof res.body.ticket, "string")

  const deleteRes = fakeRes()
  await app.deleteAccount(
    { user: { uid: "uid-1" }, headers: { "x-deletion-ticket": res.body.ticket } },
    deleteRes
  )
  assert.equal(deleteRes.statusCode, 200)
  assert.deepEqual(calls.deleteAccount, ["uid-1"])
  assert.deepEqual(calls.deleteAuthUser, ["uid-1"])

  const replayRes = fakeRes()
  await app.deleteAccount(
    { user: { uid: "uid-1" }, headers: { "x-deletion-ticket": res.body.ticket } },
    replayRes
  )
  assert.equal(replayRes.statusCode, 403)
  assert.equal(replayRes.body.code, "deletion_ticket_required")
  assert.deepEqual(calls.deleteAccount, ["uid-1"])
})

test("tiket milik akun lain tidak bisa dipakai menghapus", async () => {
  const { app, calls } = setup()
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "benar" } },
    res
  )

  const otherRes = fakeRes()
  await app.deleteAccount(
    { user: { uid: "uid-2" }, headers: { "x-deletion-ticket": res.body.ticket } },
    otherRes
  )
  assert.equal(otherRes.statusCode, 403)
  assert.deepEqual(calls.deleteAccount, [])
})

test("tiket sah tapi penghapusan gagal: error dilaporkan sekali, tiket hangus", async () => {
  const calls = []
  const { app } = setup({
    deleteAccount: async uid => {
      calls.push(uid)
      throw new Error("store down")
    }
  })
  const res = fakeRes()
  await app.requestTicket(
    { user: { uid: "uid-1", email: "a@example.com" }, body: { method: "password", password: "benar" } },
    res
  )

  const deleteRes = fakeRes()
  await app.deleteAccount(
    { user: { uid: "uid-1" }, headers: { "x-deletion-ticket": res.body.ticket } },
    deleteRes
  )
  assert.equal(deleteRes.statusCode, 500)
  assert.deepEqual(calls, ["uid-1"])

  const retryRes = fakeRes()
  await app.deleteAccount(
    { user: { uid: "uid-1" }, headers: { "x-deletion-ticket": res.body.ticket } },
    retryRes
  )
  assert.equal(retryRes.statusCode, 403)
  assert.deepEqual(calls, ["uid-1"])
})
