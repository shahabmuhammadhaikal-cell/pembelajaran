/** Endpoint progres per akun (Firebase Auth + Firestore) di backend Express. */
import { API_BASE } from "./firebase"

const TIMEOUT_MS = 12000

function url(path) {
  return `${API_BASE}${String(path || "").replace(/^\/+/, "")}`
}

/** Fetch dengan batas waktu agar status "menyambung" tidak menggantung. */
async function request(path, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let res
  try {
    res = await fetch(url(path), { ...options, signal: controller.signal })
  } catch (error) {
    if (error && error.name === "AbortError") throw new Error("Server tidak merespons. Coba lagi.")
    const offline = new Error("Tidak bisa menyambung ke server.")
    offline.offline = true
    throw offline
  } finally {
    clearTimeout(timer)
  }
  const type = String(res.headers.get("content-type") || "")
  const data = type.includes("json") ? await res.json().catch(() => ({})) : {}
  if (!res.ok) {
    const error = new Error((data && data.error) || `HTTP ${res.status}`)
    error.code = (data && data.code) || ""
    error.status = res.status
    throw error
  }
  return data
}

/** Ambil progres akun yang tersimpan di Firestore. */
export function fetchAccount(token) {
  return request("api/account/progress", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  })
}

/** Simpan progres anak ke akun; server menggabungkannya dengan data lama. */
export function saveAccountKids(token, kids) {
  return request("api/account/progress", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ kids })
  })
}
