import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { STICKERS } from "./data"

const STORAGE_KEY = "pembelajar-mobile-v1"
export const MISTAKE_LIMIT = 80

export const DEFAULT_KIDS = {
  stars: 0,
  learned: {},
  topicsDone: {},
  stickers: {},
  stories: {},
  mistakes: {},
  best: { guess: 0, listen: 0, sentence: 0, letter: 0 },
  lastTopic: "",
  settings: { lang: "id", sound: true, slow: false, length: "normal" }
}

const KidsContext = createContext(null)

/** Buka stiker bertanda "Kumpulkan N bintang" sesuai jumlah bintang. */
function applyStarStickers(state) {
  const unlocked = { ...state.stickers }
  let changed = false
  for (const sticker of STICKERS) {
    const match = /^star-(\d+)$/.exec(sticker.id)
    if (!match || unlocked[sticker.id]) continue
    if (state.stars >= Number(match[1])) {
      unlocked[sticker.id] = Date.now()
      changed = true
    }
  }
  return changed ? { ...state, stickers: unlocked } : state
}

function withDefaults(value) {
  const source = value && typeof value === "object" ? value : {}
        return applyStarStickers({
        ...DEFAULT_KIDS,
        ...source,
        learned: { ...source.learned },
        topicsDone: { ...source.topicsDone },
        stickers: { ...source.stickers },
        stories: { ...source.stories },
        mistakes: { ...source.mistakes },
        best: { ...DEFAULT_KIDS.best, ...source.best },
        settings: { ...DEFAULT_KIDS.settings, ...source.settings }
      })
}

export function KidsProvider({ children }) {
  const [kids, setKids] = useState(DEFAULT_KIDS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (cancelled) return
        if (raw) {
          try {
            setKids(withDefaults(JSON.parse(raw)))
          } catch {
            /* data rusak: mulai dari awal */
          }
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(kids)).catch(() => {})
  }, [kids, ready])

  const addStars = useCallback(amount => {
    const value = Math.max(0, Math.round(Number(amount) || 0))
    if (!value) return
    setKids(previous => applyStarStickers({ ...previous, stars: previous.stars + value }))
  }, [])

  const markLearned = useCallback(key => {
    if (!key) return
    setKids(previous =>
      previous.learned[key] ? previous : { ...previous, learned: { ...previous.learned, [key]: 1 } }
    )
  }, [])

  const finishTopic = useCallback(topicId => {
    if (!topicId) return
    setKids(previous =>
      previous.topicsDone[topicId]
        ? previous
        : { ...previous, topicsDone: { ...previous.topicsDone, [topicId]: Date.now() } }
    )
  }, [])

  const unlockSticker = useCallback(id => {
    if (!id) return
    setKids(previous =>
      previous.stickers[id]
        ? previous
        : { ...previous, stickers: { ...previous.stickers, [id]: Date.now() } }
    )
  }, [])

  const recordBest = useCallback((gameId, score) => {
    if (!gameId) return
    setKids(previous => {
      const current = previous.best[gameId] || 0
      if (score <= current) return previous
      return { ...previous, best: { ...previous.best, [gameId]: Math.round(score) } }
    })
  }, [])

  const recordMistake = useCallback((topicId, key) => {
    if (!topicId || !key) return
    const signature = `${topicId}:${key}`.slice(0, 80)
    setKids(previous => {
      const current = previous.mistakes[signature]
      const next = {
        ...previous.mistakes,
        [signature]: { count: ((current && current.count) || 0) + 1, at: Date.now() }
      }
      const keys = Object.keys(next)
      if (keys.length > MISTAKE_LIMIT) {
        keys
          .sort((a, b) => next[a].at - next[b].at)
          .slice(0, keys.length - MISTAKE_LIMIT)
          .forEach(old => delete next[old])
      }
      return { ...previous, mistakes: next }
    })
  }, [])

  const forgetMistake = useCallback(signature => {
    if (!signature) return
    setKids(previous => {
      if (!previous.mistakes[signature]) return previous
      const next = { ...previous.mistakes }
      delete next[signature]
      return { ...previous, mistakes: next }
    })
  }, [])

  const readStory = useCallback(storyId => {
    if (!storyId) return
    setKids(previous =>
      previous.stories[storyId]
        ? previous
        : { ...previous, stories: { ...previous.stories, [storyId]: Date.now() } }
    )
  }, [])

  const setSetting = useCallback((key, value) => {
    setKids(previous => ({ ...previous, settings: { ...previous.settings, [key]: value } }))
  }, [])

  const setLastTopic = useCallback(topicId => {
    setKids(previous => ({ ...previous, lastTopic: topicId || "" }))
  }, [])

  const reset = useCallback(() => setKids(DEFAULT_KIDS), [])

  /** Ganti seluruh progres, mis. hasil penggabungan dengan data akun. */
  const replace = useCallback(value => setKids(withDefaults(value)), [])

  const actions = useMemo(
    () => ({
      addStars,
      markLearned,
      finishTopic,
      unlockSticker,
      recordBest,
      recordMistake,
      forgetMistake,
      readStory,
      setSetting,
      setLastTopic,
      reset,
      replace
    }),
    [
      addStars,
      markLearned,
      finishTopic,
      unlockSticker,
      recordBest,
      recordMistake,
      forgetMistake,
      readStory,
      setSetting,
      setLastTopic,
      reset,
      replace
    ]
  )

  const value = useMemo(() => ({ kids, ready, actions }), [kids, ready, actions])

  return <KidsContext.Provider value={value}>{children}</KidsContext.Provider>
}

export function useKids() {
  const value = useContext(KidsContext)
  if (!value) throw new Error("useKids harus dipakai di dalam KidsProvider")
  return value
}
