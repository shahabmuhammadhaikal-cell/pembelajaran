import { useCallback, useEffect, useMemo, useState } from "react"
import {
  KIDS_PROFILE_DEFAULTS,
  PROFILE_LIMIT,
  kidsDocHasProgress,
  mergeKidsDoc,
  newProfile,
  normalizeKidsDoc,
  stripResetTimestamps
} from "../lib/kidsMerge.js"
import { localDayKeyWithOffset } from "../lib/dates.js"

export const KIDS_KEY = "pembelajar_kids_v2"
const LEGACY_KIDS_KEY = "pembelajar_kids_v1"

function defaultDoc() {
  return { active: "p1", profiles: { p1: newProfile("p1", "Anak 1") } }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function load() {
  return normalizeKidsDoc(readJson(KIDS_KEY) || readJson(LEGACY_KIDS_KEY)) || defaultDoc()
}

/** Hapus semua data Mode Anak (termasuk format lama) saat logout/hapus akun. */
export function clearKidsStorage() {
  try {
    localStorage.removeItem(KIDS_KEY)
    localStorage.removeItem(LEGACY_KIDS_KEY)
  } catch {
    /* localStorage diblokir: abaikan */
  }
}

/** Progres beberapa anak: satu dokumen berisi profil-profil, satu profil aktif. */
export function useKidsProgress() {
  const [doc, setDoc] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KIDS_KEY, JSON.stringify(doc))
      localStorage.removeItem(LEGACY_KIDS_KEY)
    } catch {
      /* kuota penuh: abaikan */
    }
  }, [doc])

  const kids = doc.profiles[doc.active] || Object.values(doc.profiles)[0] || newProfile("p1", "Anak 1")

  const profiles = useMemo(
    () =>
      Object.values(doc.profiles).map(profile => ({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        stars: profile.stars || 0
      })),
    [doc]
  )

  const updateActive = useCallback(updater => {
    setDoc(previous => {
      const current = previous.profiles[previous.active] || newProfile(previous.active, "Anak 1")
      return {
        ...previous,
        profiles: { ...previous.profiles, [previous.active]: updater(current) }
      }
    })
  }, [])

  const addStars = useCallback(
    amount => {
      const value = Math.max(0, Math.round(Number(amount) || 0))
      if (!value) return
      updateActive(previous => ({ ...previous, stars: (previous.stars || 0) + value }))
    },
    [updateActive]
  )

  const unlockSticker = useCallback(
    id => {
      if (!id) return
      updateActive(previous => {
        if (previous.stickers[id]) return previous
        return { ...previous, stickers: { ...previous.stickers, [id]: Date.now() } }
      })
    },
    [updateActive]
  )

  const markLearned = useCallback(
    key => {
      if (!key) return
      updateActive(previous =>
        previous.learned[key] ? previous : { ...previous, learned: { ...previous.learned, [key]: 1 } }
      )
    },
    [updateActive]
  )

  const finishTopic = useCallback(
    topicId => {
      if (!topicId) return
      updateActive(previous => {
        if (previous.topicsDone[topicId]) return previous
        return { ...previous, topicsDone: { ...previous.topicsDone, [topicId]: Date.now() } }
      })
    },
    [updateActive]
  )

  const readStory = useCallback(
    storyId => {
      if (!storyId) return
      updateActive(previous =>
        previous.stories[storyId]
          ? previous
          : { ...previous, stories: { ...previous.stories, [storyId]: Date.now() } }
      )
    },
    [updateActive]
  )

  const recordBest = useCallback(
    (game, score) => {
      if (!game) return
      updateActive(previous => {
        const current = previous.best[game] || 0
        if (score <= current) return previous
        return { ...previous, best: { ...previous.best, [game]: score } }
      })
    },
    [updateActive]
  )

  const setSetting = useCallback(
    (key, value) => {
      updateActive(previous => ({
        ...previous,
        settings: { ...previous.settings, [key]: value }
      }))
    },
    [updateActive]
  )

  /** Terapkan data akun (semua profil) tanpa menghapus profil lokal lain. */
  const hydrate = useCallback((remote, options = {}) => {
    if (!remote || typeof remote !== "object") return
    const remoteDoc = normalizeKidsDoc(remote)
    if (!remoteDoc) return
    setDoc(previous => {
      // Reset data tamu sebelum login tidak boleh menghapus progres akun lama.
      const local = options.firstLogin ? stripResetTimestamps(previous) : previous
      // Perangkat baru masih berisi profil bawaan kosong: ikuti profil aktif akun.
      if (!local || !kidsDocHasProgress(local)) return remoteDoc
      return mergeKidsDoc(local, remoteDoc) || previous
    })
  }, [])

  /** Ganti seluruh dokumen profil (dipakai saat akun berbeda di perangkat ini). */
  const replace = useCallback(data => {
    setDoc(normalizeKidsDoc(data) || defaultDoc())
  }, [])

  const switchProfile = useCallback(profileId => {
    setDoc(previous => (previous.profiles[profileId] ? { ...previous, active: profileId } : previous))
  }, [])

  const addProfile = useCallback(
    name => {
      const clean = String(name || "").trim().slice(0, 40)
      if (!clean) return false
      if (Object.keys(doc.profiles).length >= PROFILE_LIMIT) return false
      const id = `p${Date.now().toString(36)}`
      setDoc(previous => ({
        ...previous,
        active: id,
        profiles: { ...previous.profiles, [id]: newProfile(id, clean) }
      }))
      return true
    },
    [doc.profiles]
  )

  const renameProfile = useCallback((profileId, name) => {
    const clean = String(name || "").trim().slice(0, 40)
    if (!clean) return
    setDoc(previous =>
      previous.profiles[profileId]
        ? {
            ...previous,
            profiles: {
              ...previous.profiles,
              [profileId]: { ...previous.profiles[profileId], name: clean }
            }
          }
        : previous
    )
  }, [])

  const setLastTopic = useCallback(
    topicId => {
      updateActive(previous => ({ ...previous, lastTopic: topicId || "" }))
    },
    [updateActive]
  )

  /** Catat satu aktivitas belajar hari ini + perbarui runtutan hari (streak). */
  const logActivity = useCallback(() => {
    const today = localDayKeyWithOffset(0)
    const yesterday = localDayKeyWithOffset(-1)
    updateActive(previous => {
      const base =
        previous.daily && previous.daily.day === today
          ? previous.daily
          : { day: today, activities: 0, goal: previous.daily?.goal || 3, claimed: 0 }
      const streak = previous.streak || { last: "", count: 0 }
      const nextStreak =
        streak.last === today
          ? streak
          : { last: today, count: streak.last === yesterday ? (streak.count || 0) + 1 : 1 }
      return {
        ...previous,
        daily: { ...base, activities: (base.activities || 0) + 1 },
        streak: nextStreak
      }
    })
  }, [updateActive])

  const claimDaily = useCallback(() => {
    const today = localDayKeyWithOffset(0)
    updateActive(previous => {
      const daily =
        previous.daily && previous.daily.day === today
          ? previous.daily
          : { day: today, activities: 0, goal: previous.daily?.goal || 3, claimed: 0 }
      if (daily.claimed) return previous
      if ((daily.activities || 0) < (daily.goal || 3)) return previous
      return { ...previous, daily: { ...daily, claimed: Date.now() } }
    })
  }, [updateActive])

  const reset = useCallback(() => {
    updateActive(previous => ({
      ...KIDS_PROFILE_DEFAULTS,
      best: { ...KIDS_PROFILE_DEFAULTS.best },
      daily: { ...KIDS_PROFILE_DEFAULTS.daily },
      streak: { ...KIDS_PROFILE_DEFAULTS.streak },
      settings: { ...KIDS_PROFILE_DEFAULTS.settings },
      id: previous.id,
      name: previous.name,
      avatar: previous.avatar,
      resetAt: Date.now()
    }))
  }, [updateActive])

  return {
    kids,
    kidsDoc: doc,
    profiles,
    activeProfileId: doc.active,
    addProfile,
    switchProfile,
    renameProfile,
    addStars,
    unlockSticker,
    markLearned,
    finishTopic,
    readStory,
    recordBest,
    setSetting,
    setLastTopic,
    hydrate,
    replace,
    logActivity,
    claimDaily,
    reset
  }
}
