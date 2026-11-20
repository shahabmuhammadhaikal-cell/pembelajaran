/**
 * Setelan AI per perangkat (URL + model).
 *
 * Hanya URL dan nama model yang disimpan di browser. Kunci API untuk layanan
 * hosted selalu berada di environment server (`AI_API_KEY`) dan tidak pernah
 * dikirim ke klien.
 */

const URL_KEY = "pembelajar_ai_url"
const MODEL_KEY = "pembelajar_ai_model"
const LEGACY_URL_KEY = "pembelajar_ollama_url"
const LEGACY_MODEL_KEY = "pembelajar_ollama_model"

function storage() {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

export function getAiConfig() {
  const store = storage()
  if (!store) return { url: "", model: "" }
  return {
    url: store.getItem(URL_KEY) || store.getItem(LEGACY_URL_KEY) || "",
    model: store.getItem(MODEL_KEY) || store.getItem(LEGACY_MODEL_KEY) || ""
  }
}

export function saveAiConfig({ url = "", model = "" } = {}) {
  const store = storage()
  if (!store) return { url: "", model: "" }
  const nextUrl = String(url || "").trim()
  const nextModel = String(model || "").trim()
  if (nextUrl) store.setItem(URL_KEY, nextUrl)
  else store.removeItem(URL_KEY)
  if (nextModel) store.setItem(MODEL_KEY, nextModel)
  else store.removeItem(MODEL_KEY)
  store.removeItem(LEGACY_URL_KEY)
  store.removeItem(LEGACY_MODEL_KEY)
  return { url: nextUrl, model: nextModel }
}

/** Bentuk opsi yang dikirim ke backend (nama field dipertahankan agar kompatibel). */
export function aiRequestOptions() {
  const { url, model } = getAiConfig()
  return { ollamaUrl: url, ollamaModel: model }
}
