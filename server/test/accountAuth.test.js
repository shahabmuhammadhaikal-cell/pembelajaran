const test = require("node:test")
const assert = require("node:assert/strict")
const { validateGoogleProfile, verifyPassword, verifyGoogleIdToken } = require("../lib/accountReauth")

const NOW = 2_000_000_000_000
const CLIENT_ID = "abc.apps.googleusercontent.com"
const validProfile = {
  aud: CLIENT_ID,
  iss: "accounts.google.com",
  exp: Math.floor(NOW / 1000) + 60,
  email: "Anak@Example.com",
  email_verified: "true"
}

test("profil Google valid diterima", () => {
  assert.equal(
    validateGoogleProfile(validProfile, {
      email: "anak@example.com",
      clientId: CLIENT_ID,
      now: NOW
    }),
    true
  )
})

test("profil Google dengan audience atau email lain ditolak", () => {
  assert.equal(
    validateGoogleProfile({ ...validProfile, aud: "lain" }, {
      email: "anak@example.com",
      clientId: CLIENT_ID,
      now: NOW
    }),
    false
  )
  assert.equal(
    validateGoogleProfile({ ...validProfile, email: "lain@example.com" }, {
      email: "anak@example.com",
      clientId: CLIENT_ID,
      now: NOW
    }),
    false
  )
})

test("profil Google kedaluwarsa atau belum terverifikasi ditolak", () => {
  assert.equal(
    validateGoogleProfile({ ...validProfile, exp: Math.floor(NOW / 1000) - 1 }, {
      email: "anak@example.com",
      clientId: CLIENT_ID,
      now: NOW
    }),
    false
  )
  assert.equal(
    validateGoogleProfile({ ...validProfile, email_verified: false }, {
      email: "anak@example.com",
      clientId: CLIENT_ID,
      now: NOW
    }),
    false
  )
})

test("password yang benar diterima, password salah ditolak", async () => {
  const okFetch = async () => ({ ok: true, json: async () => ({ localId: "uid-1" }) })
  assert.equal(
    await verifyPassword({
      email: "a@example.com",
      password: "rahasia",
      uid: "uid-1",
      apiKey: "key",
      fetchImpl: okFetch
    }),
    true
  )

  const badFetch = async () => ({ ok: false, json: async () => ({ error: "INVALID_PASSWORD" }) })
  await assert.rejects(
    verifyPassword({
      email: "a@example.com",
      password: "salah",
      uid: "uid-1",
      apiKey: "key",
      fetchImpl: badFetch
    }),
    error => error.code === "reauth_failed" && error.status === 401
  )
})

test("API key yang ditolak dilaporkan sebagai masalah konfigurasi, bukan password salah", async () => {
  const invalidKeyFetch = async () => ({
    ok: false,
    json: async () => ({ error: { message: "API_KEY_INVALID" } })
  })
  await assert.rejects(
    verifyPassword({
      email: "a@example.com",
      password: "apa-saja",
      uid: "uid-1",
      apiKey: "key",
      fetchImpl: invalidKeyFetch
    }),
    error => error.code === "reauth_unconfigured" && error.status === 503
  )
})

test("verifikasi password gagal tertutup tanpa API key", async () => {
  await assert.rejects(
    verifyPassword({ email: "a@example.com", password: "x", uid: "uid-1", apiKey: "" }),
    error => error.code === "reauth_unconfigured" && error.status === 503
  )
})

test("verifikasi Google gagal tertutup tanpa client id", async () => {
  await assert.rejects(
    verifyGoogleIdToken({ idToken: "token", email: "a@example.com", clientId: "" }),
    error => error.code === "google_reauth_unconfigured" && error.status === 503
  )
})

test("verifikasi Google menerima tokeninfo dengan audience dan email yang cocok", async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      ...validProfile,
      exp: Math.floor(Date.now() / 1000) + 60
    })
  })
  assert.equal(
    await verifyGoogleIdToken({
      idToken: "token-google",
      email: "anak@example.com",
      clientId: CLIENT_ID,
      fetchImpl
    }),
    true
  )
})

test("akun tanpa email tidak bisa diverifikasi dengan password maupun Google", async () => {
  await assert.rejects(
    verifyPassword({ email: "", password: "x", uid: "uid-1", apiKey: "key" }),
    error => error.code === "reauth_failed" && error.status === 400
  )
  assert.equal(
    validateGoogleProfile(validProfile, { email: "", clientId: CLIENT_ID, now: NOW }),
    false
  )
})
