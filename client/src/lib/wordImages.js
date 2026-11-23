import { useEffect, useState } from "react"
import { appUrl } from "./api.js"

/**
 * Peta gambar kata: { "apple": "img/words/apple.jpg", ... }.
 * Dimuat sekali per sesi dari file statis agar tidak menambah request tiap kartu.
 */
let cache = null
let pending = null

export function loadWordImages() {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = fetch(appUrl("img/words/index.json"))
      .then(res => (res.ok ? res.json() : {}))
      .then(map => {
        cache = map && typeof map === "object" ? map : {}
        return cache
      })
      .catch(() => {
        cache = {}
        return cache
      })
  }
  return pending
}

export function useWordImages() {
  const [map, setMap] = useState(cache || {})
  useEffect(() => {
    let alive = true
    loadWordImages().then(next => {
      if (alive) setMap(next)
    })
    return () => {
      alive = false
    }
  }, [])
  return map
}

/** URL gambar untuk satu entri, atau string kosong bila belum ada. */
export function imageForEntry(map, item) {
  if (!item || !map) return ""
  const key = String(item.en || "").toLowerCase().trim()
  if (!key) return ""
  const file = map[key]
  return file ? appUrl(file) : ""
}
