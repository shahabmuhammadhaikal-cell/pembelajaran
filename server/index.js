require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const fs = require("fs")
const fsp = require("fs/promises")
const path = require("path")
const crypto = require("crypto")
const { parse } = require("csv-parse/sync")
const googleTTS = require("google-tts-api")
const { createStore } = require("./db")
const { createLexiconCache } = require("./lib/lexicon")
const { requireUser, authConfigured, deleteAuthUser, userFromToken } = require("./lib/accountAuth")
const { mergeAccount } = require("./lib/accountMerge")
const { summarizeAccount } = require("./lib/accountStats")
const { sanitizeAccountPatch } = require("./lib/accountPayload")
const { verifyPassword, verifyGoogleIdToken } = require("./lib/accountReauth")
const { createDeletionTickets } = require("./lib/deletionTicket")
const { createAccountDeletion } = require("./lib/accountDeletion")
const {
  resolveAiConfig,
  getAiStatus,
  requestAiTranslation,
  requestAiSuggestionDraft,
  normalizeAiSourceLang
} = require("./lib/ai")

const ROOT = path.resolve(__dirname, "..")
const PORT = Math.max(1, Number(process.env.PORT || 8020) || 8020)
const HOST = process.env.HOST || "0.0.0.0"
const API_BASE_URL = process.env.API_BASE_URL || ""
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || "admin").trim() || "admin"
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim()
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || "")
  .split(",")
  .map(value => value.trim().toLowerCase())
  .filter(Boolean)
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || "*")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean)
const UPLOAD_DIR = path.join(ROOT, "assets", "user-images")
const MAP_PATH = path.join(UPLOAD_DIR, "user_images.json")
const ANIMALS_DIR = path.join(ROOT, "assets", "animals")
const ANIMALS_PATH = path.join(ANIMALS_DIR, "animals.json")
const VEGETABLES_DIR = path.join(ROOT, "assets", "vegetables")
const VEGETABLES_PATH = path.join(VEGETABLES_DIR, "vegetables.json")
const DATA_DIR = path.join(ROOT, "assets", "data")
const WORD_SUGGESTIONS_PATH = path.join(DATA_DIR, "word_suggestions.json")

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
})

const ttsRate = new Map()
const adminTokens = new Map()
const accountWriteRate = new Map()
const deletionAttempts = new Map()
const familyAttempts = new Map()
const deletionTickets = createDeletionTickets()

/** Batasi percobaan verifikasi hapus akun: 5 kali per 15 menit per uid. */
function allowDeletionAttempt(uid) {
  const now = Date.now()
  if (deletionAttempts.size > 5000) deletionAttempts.clear()
  const items = (deletionAttempts.get(uid) || []).filter(ts => now - ts < 15 * 60_000)
  if (items.length >= 5) {
    deletionAttempts.set(uid, items)
    return false
  }
  items.push(now)
  deletionAttempts.set(uid, items)
  return true
}

/** Batasi tebakan kode keluarga: 10 percobaan per 15 menit per akun. */
function allowFamilyJoin(uid) {
  const now = Date.now()
  if (familyAttempts.size > 5000) familyAttempts.clear()
  const items = (familyAttempts.get(uid) || []).filter(ts => now - ts < 15 * 60_000)
  if (items.length >= 10) {
    familyAttempts.set(uid, items)
    return false
  }
  items.push(now)
  familyAttempts.set(uid, items)
  return true
}

/** Batasi penyimpanan akun agar satu klien tidak membanjiri Firestore. */
function allowAccountWrite(uid) {
  const now = Date.now()
  if (accountWriteRate.size > 5000) accountWriteRate.clear()
  const items = (accountWriteRate.get(uid) || []).filter(ts => now - ts < 60_000)
  if (items.length >= 60) {
    accountWriteRate.set(uid, items)
    return false
  }
  items.push(now)
  accountWriteRate.set(uid, items)
  return true
}

function logEvent(kind, detail) {
  const stamp = new Date().toISOString()
  console.log(`[${stamp}] ${kind}: ${detail}`)
}

async function ensureJsonFile(filePath, initialValue) {
  try {
    await fsp.access(filePath, fs.constants.F_OK)
  } catch {
    await fsp.writeFile(filePath, JSON.stringify(initialValue, null, 2), "utf8")
  }
}

async function ensureStorage() {
  await fsp.mkdir(UPLOAD_DIR, { recursive: true })
  await fsp.mkdir(ANIMALS_DIR, { recursive: true })
  await fsp.mkdir(VEGETABLES_DIR, { recursive: true })
  await fsp.mkdir(DATA_DIR, { recursive: true })
  await ensureJsonFile(MAP_PATH, {})
  await ensureJsonFile(ANIMALS_PATH, [])
  await ensureJsonFile(VEGETABLES_PATH, [])
  await ensureJsonFile(WORD_SUGGESTIONS_PATH, [])
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath, data) {
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
}

function sanitizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "img"
}

function buildEntryKey(entry) {
  return [
    String(entry && entry.en || "").trim().toLowerCase(),
    String(entry && entry.ar || "").trim().toLowerCase(),
    String(entry && entry.id || "").trim().toLowerCase()
  ].join("|")
}

function normalizeWordSuggestion(entry) {
  const source = entry && typeof entry === "object" ? entry : {}
  const now = Date.now()
  const status = String(source.status || "pending").trim().toLowerCase() === "updated" ? "updated" : "pending"
  return {
    id: String(source.id || crypto.randomUUID().slice(0, 12)),
    kind: String(source.kind || "word").trim().toLowerCase() || "word",
    request: String(source.request || "").trim(),
    meaning: String(source.meaning || "").trim(),
    category: String(source.category || "").trim(),
    note: String(source.note || "").trim(),
    status,
    ts: Number(source.ts || now) || now,
    updated_at: Number(source.updated_at || 0) || 0
  }
}

async function loadWordSuggestions() {
  const raw = await readJsonFile(WORD_SUGGESTIONS_PATH, [])
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const items = []
  for (const item of raw) {
    const normalized = normalizeWordSuggestion(item)
    if (!normalized.request || seen.has(normalized.id)) continue
    seen.add(normalized.id)
    items.push(normalized)
  }
  return items
}

async function saveWordSuggestions(items) {
  await writeJsonFile(WORD_SUGGESTIONS_PATH, items)
}

function allowTts(ip) {
  const now = Date.now()
  const items = (ttsRate.get(ip) || []).filter(ts => now - ts < 10_000)
  if (items.length >= 5) {
    ttsRate.set(ip, items)
    return false
  }
  items.push(now)
  ttsRate.set(ip, items)
  return true
}

function normalizeImportedRecord(record) {
  if (!record || typeof record !== "object") return null
  const item = {
    en: String(record.en || "").trim(),
    ar: String(record.ar || "").trim(),
    id: String(record.id || "").trim(),
    emoji: String(record.emoji || "").trim(),
    tags: Array.isArray(record.tags)
      ? record.tags.map(v => String(v || "").trim()).filter(Boolean)
      : String(record.tags || "").split(",").map(v => v.trim()).filter(Boolean),
    synonyms_en: Array.isArray(record.synonyms_en)
      ? record.synonyms_en.map(v => String(v || "").trim()).filter(Boolean)
      : String(record.synonyms_en || "").split(",").map(v => v.trim()).filter(Boolean),
    synonyms_id: Array.isArray(record.synonyms_id)
      ? record.synonyms_id.map(v => String(v || "").trim()).filter(Boolean)
      : String(record.synonyms_id || "").split(",").map(v => v.trim()).filter(Boolean)
  }
  const tr = String(record.tr || "").trim()
  if (tr) item.tr = tr
  return item.en || item.ar || item.id ? item : null
}

function parseImportBuffer(buffer, filename) {
  const ext = path.extname(String(filename || "")).toLowerCase()
  const text = buffer.toString("utf8")
  if (ext === ".json") {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed.map(normalizeImportedRecord).filter(Boolean) : []
  }
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
  })
  return rows.map(normalizeImportedRecord).filter(Boolean)
}

/**
 * Gabungkan entri hasil import admin ke satu kategori lalu simpan lewat store,
 * sehingga data manual ikut tersimpan di Firestore (bukan hanya JSON lokal).
 */
async function mergeImportedData(store, categoryId, importedItems) {
  if (typeof store.setCategoryEntries !== "function") {
    throw new Error("Store aktif tidak mendukung penyimpanan entri")
  }
  const existing = await store.getEntries(categoryId)
  const map = new Map()
  for (const item of Array.isArray(existing) ? existing : []) {
    const normalized = normalizeImportedRecord(item)
    if (!normalized) continue
    map.set(buildEntryKey(normalized), item)
  }
  for (const item of importedItems) map.set(buildEntryKey(item), item)
  const merged = Array.from(map.values())
  await store.setCategoryEntries(categoryId, merged, { manual: true })
  return { imported: importedItems.length, total: merged.length }
}

function sendError(res, status, message) {
  res.status(status).json({ ok: false, error: message })
}

function issueAdminToken() {
  const token = crypto.randomUUID()
  adminTokens.set(token, Date.now() + 1000 * 60 * 60 * 12)
  return token
}

function cleanupAdminTokens() {
  const now = Date.now()
  for (const [token, expiresAt] of adminTokens.entries()) {
    if (expiresAt <= now) adminTokens.delete(token)
  }
}

function readAdminToken(req) {
  const auth = String(req.headers.authorization || "").trim()
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim()
  return String(req.headers["x-admin-token"] || "").trim()
}

function isAdminAuthorized(req) {
  cleanupAdminTokens()
  const token = readAdminToken(req)
  if (!token) return false
  const expiresAt = adminTokens.get(token)
  if (!expiresAt || expiresAt <= Date.now()) {
    adminTokens.delete(token)
    return false
  }
  return true
}

/** Role akun: ADMIN_EMAILS adalah sumber utama; role tersimpan dipakai bila
 * ADMIN_EMAILS belum diisi (mis. hasil pengaturan manual di Firestore). */
function roleFor(email, account) {
  const clean = String(email || "").trim().toLowerCase()
  if (clean && ADMIN_EMAILS.includes(clean)) return "admin"
  if (!ADMIN_EMAILS.length && account && account.role === "admin") return "admin"
  return "user"
}

function familyCode() {
  // Tanpa huruf/angka yang mudah tertukar (0/O, 1/I/L).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[crypto.randomInt(0, alphabet.length)]
  }
  return code
}

function publicAccount(account, role, kids) {
  const source = account && typeof account === "object" ? account : {}
  return {
    ...source,
    ...(kids !== undefined ? { kids } : {}),
    role
  }
}

function resolvePublicUrl(relativePath) {
  const normalized = String(relativePath || "").replace(/\\/g, "/")
  if (!API_BASE_URL) return normalized
  return new URL(normalized.replace(/^\/+/, ""), API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`).toString()
}

async function createApp() {
  await ensureStorage()

  const store = await createStore()
  const lexiconCache = createLexiconCache(store)
  const storeInfo = store.healthInfo()
  logEvent(
    "store_ready",
    `kind=${storeInfo.storage}${storeInfo.contentSource ? ` content=${storeInfo.contentSource}` : ""}`
  )

  const app = express()

  // Admin bisa memakai sesi admin lama (x-admin-token) atau akun Firebase
  // yang emailnya terdaftar di ADMIN_EMAILS / punya role admin.
  const requireAdmin = async (req, res, next) => {
    if (isAdminAuthorized(req)) {
      next()
      return
    }
    try {
      const header = String(req.headers.authorization || "")
      const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
      const user = token ? await userFromToken(token) : null
      if (user) {
        const account = await store.getAccount(user.uid)
        if (roleFor(user.email, account) === "admin") {
          next()
          return
        }
      }
    } catch {}
    sendError(res, 401, "Admin authorization required")
  }

  app.use(cors({
    origin(origin, callback) {
      if (!origin || !CORS_ORIGINS.length || CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error("Origin not allowed by CORS"))
    }
  }))
  app.use(express.json({ limit: "2mb" }))
  app.use(express.urlencoded({ extended: true }))

  app.get("/admin/session", (req, res) => {
    const admin = isAdminAuthorized(req)
    res.json({ ok: true, admin, username: admin ? ADMIN_USERNAME : "" })
  })

  app.post("/admin/login", (req, res) => {
    const username = String(req.body && req.body.username || "").trim()
    const password = String(req.body && req.body.password || "")
    if (!ADMIN_PASSWORD) {
      sendError(res, 503, "Admin password is not configured")
      return
    }
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      sendError(res, 401, "Username atau password admin salah")
      return
    }
    const token = issueAdminToken()
    logEvent("admin_login_ok", username)
    res.json({ ok: true, admin: true, token, username: ADMIN_USERNAME })
  })

  app.post("/admin/logout", (req, res) => {
    const token = readAdminToken(req)
    if (token) adminTokens.delete(token)
    res.json({ ok: true })
  })

  // Sinkronkan katalog + entri dari assets/data ke Firestore tanpa redeploy.
  // Kategori hasil import manual tetap dipertahankan.
  app.post("/admin/sync-content", requireAdmin, async (_req, res) => {
    if (typeof store.syncLocalContent !== "function") {
      sendError(res, 503, "Sinkronisasi materi hanya tersedia saat Firestore aktif")
      return
    }
    try {
      const result = await store.syncLocalContent()
      lexiconCache.invalidate()
      logEvent("content_sync_ok", JSON.stringify(result))
      res.json({ ok: true, ...result, store: store.healthInfo() })
    } catch (error) {
      logEvent("content_sync_error", error.message)
      sendError(res, 500, `Gagal menyinkronkan materi: ${error.message}`)
    }
  })

  app.get("/api/health", async (_req, res) => {
    const ai = resolveAiConfig()
    const storeHealth = store.healthInfo()
    let lexiconStats = null
    try {
      const lexicon = await lexiconCache.get()
      lexiconStats = lexicon.stats
    } catch {}
    res.json({
      ok: true,
      service: "pembelajaran-backend",
      version: 2,
      port: PORT,
      storage: storeHealth.storage,
      store: storeHealth,
      lexicon: lexiconStats,
      adminConfigured: !!ADMIN_PASSWORD,
      loginConfigured: authConfigured(),
      ai: {
        provider: ai.provider,
        baseUrl: ai.baseUrl,
        model: ai.model,
        keyConfigured: Boolean(ai.apiKey)
      },
    })
  })

  // ---- API data untuk frontend React ----
  app.get("/api/catalog", async (_req, res) => {
    try {
      const catalog = await store.getCatalog()
      res.set("Cache-Control", "public, max-age=60")
      res.json({ ok: true, storage: storeInfo.storage, ...catalog })
    } catch (error) {
      logEvent("catalog_error", error.message)
      sendError(res, 500, "Failed to load catalog")
    }
  })

  app.get("/api/entries/:categoryId", async (req, res) => {
    try {
      const categoryId = String(req.params.categoryId || "").trim()
      if (!categoryId) {
        sendError(res, 400, "categoryId is required")
        return
      }
      const items = await store.getEntries(categoryId)
      res.set("Cache-Control", "public, max-age=300")
      res.json({ ok: true, category: categoryId, count: items.length, items })
    } catch (error) {
      logEvent("entries_error", error.message)
      sendError(res, 500, "Failed to load entries")
    }
  })

  app.get("/api/entries", async (_req, res) => {
    try {
      const items = await store.getAllEntries()
      res.json({ ok: true, count: items.length, items })
    } catch (error) {
      logEvent("entries_all_error", error.message)
      sendError(res, 500, "Failed to load entries")
    }
  })

  app.get("/api/lexicon", async (_req, res) => {
    try {
      const lexicon = await lexiconCache.get()
      res.set("Cache-Control", "public, max-age=300")
      res.json({ ok: true, stats: lexicon.stats, en: lexicon.en, ar: lexicon.ar, id: lexicon.id })
    } catch (error) {
      logEvent("lexicon_error", error.message)
      sendError(res, 500, "Failed to build lexicon")
    }
  })

  app.get("/api/progress/:deviceId", async (req, res) => {
    try {
      const payload = await store.getProgress(req.params.deviceId)
      res.json({ ok: true, progress: payload })
    } catch (error) {
      logEvent("progress_get_error", error.message)
      sendError(res, 500, "Failed to load progress")
    }
  })

  app.put("/api/progress/:deviceId", async (req, res) => {
    try {
      const payload = req.body && typeof req.body === "object" ? req.body : null
      if (!payload) {
        sendError(res, 400, "progress payload is required")
        return
      }
      await store.saveProgress(req.params.deviceId, payload)
      res.json({ ok: true, storage: storeInfo.storage, updated_at: Date.now() })
    } catch (error) {
      logEvent("progress_put_error", error.message)
      sendError(res, 500, "Failed to save progress")
    }
  })

  // ---- Akun pengguna (Firebase Auth) - menyimpan progres per akun ----
  app.get("/api/account/progress", requireUser(), async (req, res) => {
    try {
      const account = await store.getAccount(req.user.uid)
      const role = roleFor(req.user.email, account)
      let kids = account ? account.kids : null
      let family = null
      if (account && account.familyOwner) {
        const owner = await store.getAccount(account.familyOwner).catch(() => null)
        if (owner) {
          kids = owner.kids || null
          family = {
            joined: true,
            owner: account.familyOwner,
            ownerName: (owner.profile && owner.profile.name) || "Keluarga",
            code: (owner.profile && owner.profile.familyCode) || ""
          }
        }
      }
      const view = publicAccount(account, role, kids)
      const stats = summarizeAccount({ ...(account || {}), kids })
      res.set("Cache-Control", "private, no-store")
      res.json({ ok: true, uid: req.user.uid, role, account: view, stats, family })
    } catch (error) {
      logEvent("account_get_error", error.message)
      sendError(res, 500, "Failed to load account progress")
    }
  })

  app.put("/api/account/progress", requireUser(), async (req, res) => {
    try {
      if (!allowAccountWrite(req.user.uid)) {
        res.set("Retry-After", "60")
        sendError(res, 429, "Terlalu banyak penyimpanan. Coba lagi sebentar.")
        return
      }
      const patch = sanitizeAccountPatch(req.body)
      const existing = await store.getAccount(req.user.uid)

      // Anggota keluarga menitipkan profil anak ke akun pemilik kode.
      if (existing && existing.familyOwner && patch.kids) {
        const owner = await store.getAccount(existing.familyOwner).catch(() => null)
        if (owner) {
          const mergedOwner = mergeAccount(owner, { kids: patch.kids })
          await store.saveAccount(existing.familyOwner, {
            ...mergedOwner,
            email: owner.email
          })
          delete patch.kids
        }
      }

      const merged = mergeAccount(existing, patch)
      if (existing && existing.familyOwner) delete merged.kids
      const role = roleFor(req.user.email, existing)
      const stats = summarizeAccount(merged)
      const account = await store.saveAccount(req.user.uid, {
        ...merged,
        email: req.user.email,
        role,
        stats
      })
      res.set("Cache-Control", "private, no-store")
      res.json({
        ok: true,
        uid: req.user.uid,
        role,
        account: publicAccount(account, role),
        stats,
        updated_at: account.updated_at || Date.now()
      })
    } catch (error) {
      if (error.status) {
        sendError(res, error.status, error.message)
        return
      }
      logEvent("account_put_error", error.message)
      sendError(res, 500, "Failed to save account progress")
    }
  })

  const accountDeletion = createAccountDeletion({
    tickets: deletionTickets,
    verifyPassword,
    verifyGoogleIdToken,
    deleteAccount: uid => store.deleteAccount(uid),
    deleteAuthUser,
    allowAttempt: allowDeletionAttempt,
    logEvent
  })

  app.post("/api/account/deletion-ticket", requireUser(), accountDeletion.requestTicket)

  app.delete("/api/account", requireUser(), accountDeletion.deleteAccount)

  // ---- Kode keluarga: berbagi profil Mode Anak antar akun ----
  app.post("/api/account/family/code", requireUser(), async (req, res) => {
    try {
      const existing = (await store.getAccount(req.user.uid)) || {}
      const profile = { ...(existing.profile || {}) }
      if (!profile.familyCode) {
        let code = familyCode()
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const clash = await store.findAccountByFamilyCode(code).catch(() => null)
          if (!clash) break
          code = familyCode()
        }
        profile.familyCode = code
      }
      const merged = mergeAccount(existing, { profile })
      await store.saveAccount(req.user.uid, { ...merged, email: req.user.email })
      res.set("Cache-Control", "private, no-store")
      res.json({ ok: true, code: profile.familyCode })
    } catch (error) {
      logEvent("family_code_error", error.message)
      sendError(res, 500, "Gagal membuat kode keluarga")
    }
  })

  app.post("/api/account/family", requireUser(), async (req, res) => {
    try {
      if (!allowFamilyJoin(req.user.uid)) {
        res.set("Retry-After", "900")
        sendError(res, 429, "Terlalu banyak percobaan kode keluarga. Coba lagi nanti.")
        return
      }
      const code = String(req.body && req.body.code || "").trim().toUpperCase()
      if (!/^[A-Z0-9]{4,10}$/.test(code)) {
        sendError(res, 400, "Format kode keluarga belum benar")
        return
      }
      const owner = await store.findAccountByFamilyCode(code)
      if (!owner) {
        sendError(res, 404, "Kode keluarga tidak ditemukan")
        return
      }
      if (owner.uid === req.user.uid) {
        sendError(res, 400, "Itu kode akun kamu sendiri")
        return
      }
      if (owner.familyOwner) {
        sendError(res, 400, "Akun pemilik kode itu sudah menjadi anggota keluarga lain")
        return
      }
      await store.saveAccount(req.user.uid, { familyOwner: owner.uid, email: req.user.email })
      res.json({
        ok: true,
        family: {
          joined: true,
          owner: owner.uid,
          ownerName: (owner.profile && owner.profile.name) || "Keluarga",
          code
        }
      })
    } catch (error) {
      logEvent("family_join_error", error.message)
      sendError(res, 500, "Gagal bergabung ke keluarga")
    }
  })

  app.delete("/api/account/family", requireUser(), async (req, res) => {
    try {
      await store.saveAccount(req.user.uid, { familyOwner: null, email: req.user.email })
      res.json({ ok: true })
    } catch (error) {
      logEvent("family_leave_error", error.message)
      sendError(res, 500, "Gagal keluar dari keluarga")
    }
  })

  // ---- Papan peringkat (hanya akun yang ikut, tanpa email) ----
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const accounts = await store.listAccounts(120)
      const rows = []
      for (const account of Array.isArray(accounts) ? accounts : []) {
        if (!account || !account.profile || account.profile.leaderboard !== true) continue
        const stats = summarizeAccount(account)
        rows.push({
          uid: account.uid || "",
          name: account.profile.name || "Pembelajar",
          avatar: account.profile.avatar || "🙂",
          points: stats.points,
          stars: stats.stars,
          mastered: stats.mastered,
          streak: stats.streak,
          level: stats.level,
          levelTitle: stats.levelTitle
        })
      }
      rows.sort((a, b) => b.points - a.points || b.stars - a.stars)
      const top = rows.slice(0, 20)
      let viewer = ""
      const header = String(req.headers.authorization || "")
      const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
      if (token) {
        const user = await userFromToken(token).catch(() => null)
        viewer = user ? user.uid : ""
      }
      res.set("Cache-Control", "private, no-store")
      res.json({
        ok: true,
        total: rows.length,
        rows: top.map((row, index) => ({
          rank: index + 1,
          name: row.name,
          avatar: row.avatar,
          points: row.points,
          stars: row.stars,
          mastered: row.mastered,
          streak: row.streak,
          level: row.level,
          levelTitle: row.levelTitle,
          isYou: Boolean(viewer) && row.uid === viewer
        }))
      })
    } catch (error) {
      logEvent("leaderboard_error", error.message)
      sendError(res, 500, "Gagal memuat papan peringkat")
    }
  })

  app.get("/ai/status", async (req, res) => {
    try {
      const status = await getAiStatus(req.query)
      res.set("Cache-Control", "no-store")
      res.json({ ok: true, ...status })
    } catch (error) {
      logEvent("ai_status_error", error.message)
      sendError(res, 502, `AI status error: ${error.message}`)
    }
  })

  app.post("/ai/translate", async (req, res) => {
    try {
      const text = String(req.body && req.body.text || "").trim()
      const sourceLang = normalizeAiSourceLang(req.body && req.body.sourceLang)
      if (!text) {
        sendError(res, 400, "text is required")
        return
      }
      if (text.length > 2000) {
        sendError(res, 413, "text is too long (max 2000 characters)")
        return
      }
      const config = resolveAiConfig(req.body)
      if (!config.baseUrl) {
        sendError(res, 503, "AI base URL is not configured")
        return
      }
      const result = await requestAiTranslation(config, text, sourceLang)
      res.json({
        ok: true,
        sourceLang,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        result
      })
    } catch (error) {
      logEvent("ai_translate_error", error.message)
      sendError(res, 502, `AI error: ${error.message}`)
    }
  })

  app.post("/ai/word-suggestion-draft", async (req, res) => {
    try {
      const source = req.body && typeof req.body === "object" ? req.body : {}
      const config = resolveAiConfig(source)
      if (!config.baseUrl) {
        sendError(res, 503, "AI base URL is not configured")
        return
      }
      const draftInput = {
        kind: String(source.kind || "word").trim(),
        request: String(source.request || "").trim(),
        meaning: String(source.meaning || "").trim(),
        category: String(source.category || "").trim(),
        note: String(source.note || "").trim(),
        currentCategory: String(source.currentCategory || "").trim()
      }
      if (!draftInput.request && !draftInput.note && !draftInput.meaning) {
        sendError(res, 400, "request, meaning, or note is required")
        return
      }
      const result = await requestAiSuggestionDraft(config, draftInput)
      res.json({
        ok: true,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        result
      })
    } catch (error) {
      logEvent("ai_word_suggestion_draft_error", error.message)
      sendError(res, 502, `AI error: ${error.message}`)
    }
  })

  app.get("/word-suggestions", async (_req, res) => {
    try {
      const items = (await store.listSuggestions()).slice()
      items.sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
      res.json({ items, total: items.length, storage: storeInfo.storage })
    } catch (error) {
      logEvent("word_suggestions_get_error", error.message)
      sendError(res, 500, "Failed to load word suggestions")
    }
  })

  app.post("/word-suggestions", async (req, res) => {
    try {
      const entry = normalizeWordSuggestion(req.body)
      if (!entry.request) {
        sendError(res, 400, "Request is required")
        return
      }
      const items = await store.listSuggestions()
      const next = [entry, ...items.filter(item => item.id !== entry.id)].slice(0, 500)
      await store.saveSuggestions(next)
      logEvent("word_suggestions_add_ok", entry.request.slice(0, 80))
      res.json({ ok: true, item: entry, total: next.length, storage: storeInfo.storage })
    } catch (error) {
      logEvent("word_suggestions_add_error", error.message)
      sendError(res, 500, "Failed to save word suggestion")
    }
  })

  app.post("/word-suggestions-status", requireAdmin, async (req, res) => {
    try {
      const itemId = String(req.body && req.body.id || "").trim()
      const status = String(req.body && req.body.status || "pending").trim().toLowerCase()
      if (!itemId) {
        sendError(res, 400, "id is required")
        return
      }
      if (!["pending", "updated"].includes(status)) {
        sendError(res, 400, "status must be pending or updated")
        return
      }
      const items = await store.listSuggestions()
      let updated = null
      const next = items.map(item => {
        if (item.id !== itemId) return item
        updated = Object.assign({}, item, {
          status,
          updated_at: status === "updated" ? Date.now() : 0
        })
        return updated
      })
      if (!updated) {
        sendError(res, 404, "Suggestion not found")
        return
      }
      await store.saveSuggestions(next)
      logEvent("word_suggestions_status_ok", `${itemId}:${status}`)
      res.json({ ok: true, item: updated, storage: storeInfo.storage })
    } catch (error) {
      logEvent("word_suggestions_status_error", error.message)
      sendError(res, 500, "Failed to update suggestion status")
    }
  })

  app.get("/tts", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "0.0.0.0"
      if (!allowTts(ip)) {
        sendError(res, 429, "Too Many Requests")
        return
      }
      const text = String(req.query.text || "").trim()
      const inputLang = String(req.query.lang || "ar").trim().toLowerCase()
      const lang = inputLang.startsWith("en") ? "en" : inputLang.startsWith("id") ? "id" : "ar"
      if (!text) {
        sendError(res, 400, "Text is required")
        return
      }
      const ttsUrl = googleTTS.getAudioUrl(text, {
        lang,
        slow: false,
        host: "https://translate.google.com"
      })
      const audioRes = await fetch(ttsUrl)
      if (!audioRes.ok) {
        sendError(res, 502, "TTS generation failed")
        return
      }
      res.setHeader("Content-Type", "audio/mpeg")
      res.setHeader("Cache-Control", "no-store")
      const buffer = Buffer.from(await audioRes.arrayBuffer())
      res.end(buffer)
    } catch (error) {
      logEvent("tts_error", error.message)
      sendError(res, 500, "Unexpected server error")
    }
  })

  app.post("/upload", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      const file = req.file
      if (!file || !file.buffer) {
        sendError(res, 400, "No file provided")
        return
      }
      if (!String(file.mimetype || "").startsWith("image/")) {
        sendError(res, 400, "Invalid MIME type")
        return
      }
      const ext = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].includes(path.extname(file.originalname || "").toLowerCase())
        ? path.extname(file.originalname || "").toLowerCase()
        : ".png"
      const en = String(req.body.en || "")
      const ar = String(req.body.ar || "")
      const idValue = String(req.body.id || "")
      const prev = String(req.body.prev || "")
      const base = sanitizeName(en || idValue || "img")
      const uniq = `${base}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}${ext}`
      const outPath = path.join(UPLOAD_DIR, uniq)
      await fsp.writeFile(outPath, file.buffer)
      const mapping = await readJsonFile(MAP_PATH, {})
      const key = `${en.toLowerCase()}|${ar.toLowerCase()}|${idValue.toLowerCase()}`
      const url = `/assets/user-images/${uniq}`
      mapping[key] = url
      await writeJsonFile(MAP_PATH, mapping)
      if (prev) {
        try {
          const oldPath = path.normalize(path.join(ROOT, prev.replace(/^\/+/, "")))
          if (oldPath.startsWith(UPLOAD_DIR) && oldPath !== outPath && fs.existsSync(oldPath)) {
            await fsp.unlink(oldPath)
          }
        } catch {}
      }
      logEvent("upload_ok", url)
      res.json({ url: resolvePublicUrl(url) })
    } catch (error) {
      logEvent("upload_error", error.message)
      sendError(res, 500, "Upload failed")
    }
  })

  app.post("/import-animals", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        sendError(res, 400, "No file provided")
        return
      }
      const importedItems = parseImportBuffer(req.file.buffer, req.file.originalname)
      const summary = await mergeImportedData(store, "animals", importedItems)
      lexiconCache.invalidate()
      logEvent("import_animals_ok", `count=${summary.imported} total=${summary.total} storage=${storeHealth.storage}`)
      res.json({ count: summary.imported, total: summary.total, storage: store.healthInfo().storage })
    } catch (error) {
      logEvent("import_animals_error", error.message)
      sendError(res, 400, "Failed to import animals data")
    }
  })

  app.post("/import-vegetables", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        sendError(res, 400, "No file provided")
        return
      }
      const importedItems = parseImportBuffer(req.file.buffer, req.file.originalname)
      const summary = await mergeImportedData(store, "vegetables", importedItems)
      lexiconCache.invalidate()
      logEvent("import_vegetables_ok", `count=${summary.imported} total=${summary.total} storage=${store.healthInfo().storage}`)
      res.json({ count: summary.imported, total: summary.total, storage: store.healthInfo().storage })
    } catch (error) {
      logEvent("import_vegetables_error", error.message)
      sendError(res, 400, "Failed to import vegetables data")
    }
  })

  const CLIENT_DIST = path.join(ROOT, "client", "dist")
  const clientDistExists = fs.existsSync(path.join(CLIENT_DIST, "index.html"))
  if (clientDistExists) {
    // Build React (client/dist) menjadi frontend utama bila tersedia.
    app.use(express.static(CLIENT_DIST, { extensions: ["html"] }))
  }

  app.use("/assets", express.static(path.join(ROOT, "assets"), {
    fallthrough: true,
    maxAge: "1h"
  }))

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      sendError(res, 404, "Not Found")
      return
    }
    if (clientDistExists) {
      res.sendFile(path.join(CLIENT_DIST, "index.html"))
      return
    }
    sendError(res, 404, "Frontend belum di-build. Jalankan `npm run build` di folder client.")
  })

  return app
}

async function start() {
  const app = await createApp()
  app.listen(PORT, HOST, () => {
    console.log(`Express backend ready at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/`)
  })
}

if (require.main === module) {
  start().catch(error => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = { createApp }
