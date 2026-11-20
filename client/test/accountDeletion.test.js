import test from "node:test"
import assert from "node:assert/strict"
import { deleteAccountWithReauth } from "../src/lib/accountDeletion.js"

const TICKET = "a".repeat(43)

function deps(overrides = {}) {
  const calls = { ticket: 0, delete: [], google: 0 }
  const base = {
    method: "password",
    password: "rahasia",
    getToken: async () => "id-token",
    googleReauthentication: async () => {
      calls.google += 1
      return { googleIdToken: "google-id-token" }
    },
    requestTicket: async () => {
      calls.ticket += 1
      return { ok: true, ticket: TICKET }
    },
    deleteAccount: async (token, ticket) => {
      calls.delete.push({ token, ticket })
      return { ok: true }
    }
  }
  return { calls, deps: { ...base, ...overrides } }
}

test("password salah: API hapus tidak dipanggil", async () => {
  const { calls, deps: options } = deps({
    requestTicket: async () => {
      const error = new Error("Password salah. Penghapusan dibatalkan.")
      error.code = "reauth_failed"
      throw error
    }
  })
  await assert.rejects(deleteAccountWithReauth(options), /Password salah/)
  assert.deepEqual(calls.delete, [])
})

test("Google tanpa bukti token: tiket tidak diminta dan hapus tidak dipanggil", async () => {
  const { calls, deps: options } = deps({
    method: "google",
    googleReauthentication: async () => {
      calls.google += 1
      return { googleIdToken: "" }
    }
  })
  await assert.rejects(deleteAccountWithReauth(options), /Bukti verifikasi Google/)
  assert.equal(calls.ticket, 0)
  assert.deepEqual(calls.delete, [])
})

test("respons tiket tanpa tiket sah tidak pernah memicu penghapusan", async () => {
  for (const response of [{ ok: true }, { ok: true, ticket: "" }, { ok: true, ticket: "pendek" }, { ok: false, ticket: TICKET }, null]) {
    const { calls, deps: options } = deps({ requestTicket: async () => response })
    await assert.rejects(deleteAccountWithReauth(options), /Tiket verifikasi/)
    assert.deepEqual(calls.delete, [])
  }
})

test("sesi tanpa token berhenti sebelum verifikasi", async () => {
  const { calls, deps: options } = deps({ getToken: async () => "" })
  await assert.rejects(deleteAccountWithReauth(options), /Sesi login berakhir/)
  assert.equal(calls.ticket, 0)
  assert.deepEqual(calls.delete, [])
})

test("password kosong tidak dikirim ke server", async () => {
  const { calls, deps: options } = deps({ password: "   " })
  await assert.rejects(deleteAccountWithReauth(options), /password/)
  assert.equal(calls.ticket, 0)
  assert.deepEqual(calls.delete, [])
})

test("metode tak dikenal tidak memanggil API apa pun", async () => {
  const { calls, deps: options } = deps({ method: "otp" })
  await assert.rejects(deleteAccountWithReauth(options), /Metode verifikasi/)
  assert.equal(calls.ticket, 0)
  assert.deepEqual(calls.delete, [])
})

test("verifikasi berhasil: hapus dipanggil tepat sekali dengan tiket dari server", async () => {
  const { calls, deps: options } = deps()
  await deleteAccountWithReauth(options)
  assert.equal(calls.ticket, 1)
  assert.deepEqual(calls.delete, [{ token: "id-token", ticket: TICKET }])
})

test("alur Google memakai id token popup sebagai bukti", async () => {
  const { calls, deps: options } = deps({ method: "google" })
  await deleteAccountWithReauth(options)
  assert.equal(calls.google, 1)
  assert.deepEqual(calls.delete, [{ token: "id-token", ticket: TICKET }])
})

test("kegagalan API hapus tidak diulang diam-diam", async () => {
  let attempts = 0
  const { deps: options } = deps({
    deleteAccount: async () => {
      attempts += 1
      throw new Error("Gagal menghapus akun")
    }
  })
  await assert.rejects(deleteAccountWithReauth(options), /Gagal menghapus akun/)
  assert.equal(attempts, 1)
})
