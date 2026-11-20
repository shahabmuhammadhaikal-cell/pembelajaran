const test = require("node:test")
const assert = require("node:assert/strict")
const { createDeletionTickets } = require("../lib/deletionTicket")

test("tiket hanya bisa dipakai sekali", () => {
  const store = createDeletionTickets({ ttlMs: 60_000 })
  const { ticket } = store.issue("uid-1")
  assert.equal(store.consume(ticket, "uid-1"), true)
  assert.equal(store.consume(ticket, "uid-1"), false)
})

test("tiket terikat ke uid lain dan tetap utuh untuk pemiliknya", () => {
  const store = createDeletionTickets({ ttlMs: 60_000 })
  const { ticket } = store.issue("uid-1")
  assert.equal(store.consume(ticket, "uid-2"), false)
  assert.equal(store.consume(ticket, "uid-1"), true)
  assert.equal(store.consume(ticket, "uid-1"), false)
})

test("tiket kedaluwarsa", () => {
  let now = 1_000
  const store = createDeletionTickets({ ttlMs: 2_000, now: () => now })
  const { ticket } = store.issue("uid-1")
  now += 2_000
  assert.equal(store.consume(ticket, "uid-1"), false)
})

test("tiket acak tidak pernah cocok", () => {
  const store = createDeletionTickets()
  assert.equal(store.consume("tiket-palsu", "uid-1"), false)
})
