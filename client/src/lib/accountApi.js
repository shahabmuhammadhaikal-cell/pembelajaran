/** Endpoint progres per akun (Firebase Auth + Firestore). */
import { apiUrl } from "./api.js"

const TIMEOUT_MS = 12000

/** Fetch dengan batas waktu agar status "menyambung" tidak menggantung selamanya. */
async function request(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error && error.name === "AbortError") throw new Error("Server tidak merespons. Coba lagi.")
    throw new Error("Tidak bisa menyambung ke server.")
  } finally {
    clearTimeout(timer)
  }
}

async function parse(res) {
  const type = String(res.headers.get("content-type") || "")
  const data = type.includes("json") ? await res.json() : {}
  if (!res.ok) {
    const error = new Error(data.error || `HTTP ${res.status}`)
    error.code = data.code || ""
    error.status = res.status
    throw error
  }
  return data
}

export async function fetchAccountProgress(token) {
  const res = await request(apiUrl("api/account/progress"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  })
  return parse(res)
}

export async function saveAccountProgress(token, payload) {
  const res = await request(apiUrl("api/account/progress"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  })
  return parse(res)
}

export async function requestDeletionTicket(token, payload) {
  const res = await request(apiUrl("api/account/deletion-ticket"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload || {})
  })
  return parse(res)
}

export async function generateFamilyCode(token) {
  const res = await request(apiUrl("api/account/family/code"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  })
  return parse(res)
}

export async function joinFamily(token, code) {
  const res = await request(apiUrl("api/account/family"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ code })
  })
  return parse(res)
}

export async function leaveFamily(token) {
  const res = await request(apiUrl("api/account/family"), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
  return parse(res)
}

export async function fetchLeaderboard(token) {
  const res = await request(apiUrl("api/leaderboard"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store"
  })
  return parse(res)
}

export async function deleteAccount(token, ticket) {
  const res = await request(apiUrl("api/account"), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Deletion-Ticket": String(ticket || "")
    }
  })
  return parse(res)
}
