/**
 * Lapisan AI yang mendukung dua protokol:
 *
 * - `ollama` — API native Ollama (`POST /api/generate`, `GET /api/tags`).
 *   Cocok untuk model lokal/privat dan default aplikasi ini.
 * - `openai` — endpoint OpenAI-compatible (`POST /v1/chat/completions`,
 *   `GET /v1/models`): OpenLLM, OpenAI, Groq, LM Studio, llama.cpp, atau
 *   Ollama versi OpenAI (`http://localhost:11434/v1`).
 *
 * Kunci API hanya dibaca dari environment server; tidak pernah dikirim ke klien.
 */

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b"
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.AI_TIMEOUT_MS || 45_000) || 45_000)
const PROBE_TIMEOUT_MS = 5_000

function normalizeRemoteUrl(value) {
  const raw = String(value || "").trim()
  if (!raw) return ""
  try {
    return new URL(raw.endsWith("/") ? raw : `${raw}/`).toString()
  } catch {
    return ""
  }
}

function pick(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim()
  }
  return ""
}

function inferProvider(baseUrl, apiKey, explicit) {
  const wanted = String(explicit || "").trim().toLowerCase()
  if (wanted === "ollama" || wanted === "openai") return wanted
  if (/\/v1\/?$/i.test(baseUrl)) return "openai"
  if (apiKey) return "openai"
  return "ollama"
}

/**
 * Gabungkan konfigurasi server dengan override dari klien.
 * Override dari klien berguna untuk Ollama di jaringan lokal pengguna.
 */
function resolveAiConfig(source) {
  const body = source && typeof source === "object" ? source : {}
  const baseUrl =
    normalizeRemoteUrl(pick(body.ollamaUrl, body.aiUrl)) ||
    normalizeRemoteUrl(pick(process.env.AI_BASE_URL, process.env.OLLAMA_BASE_URL)) ||
    normalizeRemoteUrl(DEFAULT_OLLAMA_BASE_URL)
  const model =
    pick(body.ollamaModel, body.aiModel, process.env.AI_MODEL, process.env.OLLAMA_MODEL) ||
    DEFAULT_OLLAMA_MODEL
  const apiKey = pick(process.env.AI_API_KEY, process.env.OLLAMA_API_KEY)
  const provider = inferProvider(baseUrl, apiKey, process.env.AI_PROVIDER)
  return { baseUrl, model, apiKey, provider }
}

function providerLabel(config) {
  return config.provider === "openai" ? "AI OpenAI-compatible" : "Ollama"
}

function authHeaders(config) {
  return config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}
}

function describeFetchError(config, error) {
  const label = providerLabel(config)
  if (error && error.name === "AbortError") {
    return `${label} di ${config.baseUrl} tidak menjawab tepat waktu`
  }
  const cause = error && error.cause && error.cause.code ? ` (${error.cause.code})` : ""
  return `tidak bisa terhubung ke ${label} di ${config.baseUrl}${cause}`
}

async function readJson(res) {
  return res.json().catch(() => ({}))
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Ollama Cloud memakai protokol OpenAI, tetapi belum mendukung structured output. */
function isOllamaCloud(baseUrl) {
  try {
    return new URL(baseUrl).hostname === "ollama.com"
  } catch {
    return false
  }
}

function parseModelList(payload) {
  const data = payload && typeof payload === "object" ? payload : {}
  const list = Array.isArray(data.data) ? data.data : Array.isArray(data.models) ? data.models : []
  return list
    .map(entry => String((entry && (entry.id || entry.name)) || ""))
    .filter(Boolean)
}

async function probeModels(config, endpoint) {
  try {
    const res = await fetchWithTimeout(
      endpoint,
      { headers: { Accept: "application/json", ...authHeaders(config) } },
      PROBE_TIMEOUT_MS
    )
    if (!res.ok) return { models: [], error: `HTTP ${res.status}` }
    const models = parseModelList(await readJson(res))
    return { models, error: models.length ? "" : "tidak ada model yang dilaporkan" }
  } catch (error) {
    return { models: [], error: describeFetchError(config, error) }
  }
}

/**
 * Daftar model yang tersedia.
 * Endpoint OpenAI-compatible dicoba dulu, lalu `/api/tags` (Ollama Cloud dan
 * server yang hanya mengaktifkan protokol native).
 */
async function listModels(config) {
  const endpoints = []
  if (config.provider === "openai") {
    endpoints.push(new URL("models", config.baseUrl).toString())
    try {
      endpoints.push(new URL("/api/tags", new URL(config.baseUrl).origin).toString())
    } catch {}
  } else {
    endpoints.push(new URL("api/tags", config.baseUrl).toString())
  }

  let lastError = { models: [], error: "" }
  for (const endpoint of endpoints) {
    const result = await probeModels(config, endpoint)
    if (result.models.length) return { ...result, error: "" }
    lastError = result
  }
  return lastError
}

async function getAiStatus(source) {
  const config = resolveAiConfig(source)
  const probe = await listModels(config)
  return {
    ok: true,
    configured: Boolean(config.baseUrl),
    available: probe.models.length > 0,
    provider: config.provider,
    baseUrl: config.baseUrl,
    model: config.model,
    models: probe.models,
    error: probe.error
  }
}

function extractJson(text) {
  const raw = String(text || "").trim()
  if (!raw) throw new Error("AI mengembalikan respons kosong")
  const withoutFence = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
  try {
    return JSON.parse(withoutFence)
  } catch {
    const start = withoutFence.indexOf("{")
    const end = withoutFence.lastIndexOf("}")
    if (start >= 0 && end > start) return JSON.parse(withoutFence.slice(start, end + 1))
    throw new Error("AI mengembalikan JSON yang tidak valid")
  }
}

/** Minta AI menghasilkan JSON. Kedua protokol memberi format JSON eksplisit. */
async function requestAiJson(config, prompt, schemaHint) {
  const label = providerLabel(config)
  let endpoint
  let body
  if (config.provider === "openai") {
    endpoint = new URL("chat/completions", config.baseUrl).toString()
    body = {
      model: config.model,
      temperature: 0.2,
      ...(isOllamaCloud(config.baseUrl) ? {} : { response_format: { type: "json_object" } }),
      messages: [
        { role: "system", content: `Return strict JSON only, no markdown. ${schemaHint || ""}`.trim() },
        { role: "user", content: prompt }
      ]
    }
  } else {
    endpoint = new URL("api/generate", config.baseUrl).toString()
    body = {
      model: config.model,
      prompt,
      stream: false,
      format: "json",
      options: { temperature: 0.2 }
    }
  }

  const post = async payload => {
    let res
    try {
      res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders(config) },
          body: JSON.stringify(payload)
        },
        REQUEST_TIMEOUT_MS
      )
    } catch (error) {
      throw new Error(describeFetchError(config, error))
    }
    return { res, data: await readJson(res) }
  }

  let { res, data } = await post(body)
  const errorMessage = () =>
    String(data && (data.error && (data.error.message || data.error) || data.message) || `${label} HTTP ${res.status}`)

  // Sebagian endpoint (termasuk Ollama Cloud) menolak response_format.
  if (!res.ok && body.response_format && /response_format|structured|json_object/i.test(errorMessage())) {
    const retryBody = { ...body }
    delete retryBody.response_format
    ;({ res, data } = await post(retryBody))
  }

  if (!res.ok) throw new Error(errorMessage())

  const text =
    config.provider === "openai"
      ? String(data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "")
      : String(data && data.response || "")
  return extractJson(text)
}

function normalizeAiSourceLang(value) {
  const raw = String(value || "").trim().toLowerCase()
  if (raw.startsWith("ar")) return "ar"
  if (raw.startsWith("id")) return "id"
  return "en"
}

function normalizeTranslationPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {}
  return {
    en: String(data.en || "").trim(),
    ar: String(data.ar || "").trim(),
    id: String(data.id || "").trim(),
    explanation: String(data.explanation || "").trim()
  }
}

function normalizeSuggestionDraftPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {}
  const rawKind = String(data.kind || "word").trim().toLowerCase()
  return {
    kind: ["word", "phrase", "topic"].includes(rawKind) ? rawKind : "word",
    request: String(data.request || "").trim(),
    meaning: String(data.meaning || "").trim(),
    category: String(data.category || "").trim(),
    note: String(data.note || "").trim()
  }
}

function buildTranslatePrompt(text, sourceLang) {
  return [
    "You are a translation assistant for English, Arabic, and Indonesian.",
    "Translate the user input into concise natural English, Arabic, and Indonesian.",
    "Return strict JSON only with keys: en, ar, id, explanation.",
    "The explanation must be in Indonesian, short, and mention important nuance if needed.",
    `Detected source language: ${sourceLang}.`,
    `Input: ${text}`
  ].join("\n")
}

function buildSuggestionPrompt(input) {
  const source = input && typeof input === "object" ? input : {}
  return [
    "You help draft word suggestion forms for a language-learning app.",
    "Return strict JSON only with keys: kind, request, meaning, category, note.",
    "Allowed kind values: word, phrase, topic.",
    "Use Indonesian for meaning, category, and note.",
    "Keep category short and practical.",
    "Request text should be the cleaned main request from the user.",
    `Current kind hint: ${String(source.kind || "").trim() || "word"}.`,
    `Current request: ${String(source.request || "").trim()}.`,
    `Current meaning: ${String(source.meaning || "").trim()}.`,
    `Current category: ${String(source.category || "").trim()}.`,
    `Current note: ${String(source.note || "").trim()}.`,
    `Current selected study category: ${String(source.currentCategory || "").trim()}.`
  ].join("\n")
}

async function requestAiTranslation(config, text, sourceLang) {
  const lang = normalizeAiSourceLang(sourceLang)
  const parsed = await requestAiJson(
    config,
    buildTranslatePrompt(text, lang),
    "Keys: en, ar, id, explanation."
  )
  const normalized = normalizeTranslationPayload(parsed)
  if (!normalized.en && !normalized.ar && !normalized.id) {
    throw new Error("AI response missing translation fields")
  }
  return normalized
}

async function requestAiSuggestionDraft(config, input) {
  const parsed = await requestAiJson(
    config,
    buildSuggestionPrompt(input),
    "Keys: kind, request, meaning, category, note."
  )
  const normalized = normalizeSuggestionDraftPayload(parsed)
  if (!normalized.request) {
    throw new Error("AI response missing request field")
  }
  return normalized
}

module.exports = {
  resolveAiConfig,
  getAiStatus,
  isOllamaCloud,
  listModels,
  requestAiTranslation,
  requestAiSuggestionDraft,
  normalizeRemoteUrl,
  normalizeAiSourceLang
}
