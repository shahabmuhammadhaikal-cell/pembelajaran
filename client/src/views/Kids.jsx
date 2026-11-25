import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  KID_TOPICS,
  KID_TOPIC_GROUPS,
  KID_ROUND_OPTIONS,
  KID_PLAY_ITEMS,
  TOPIC_MAP,
  KID_STICKERS,
  KID_STAR_MILESTONES,
  levelProgress
} from "../lib/kidsData.js"
import { KID_STORIES, STORY_MAP } from "../lib/kidsStories.js"
import { useKidsProgress } from "../hooks/useKidsProgress.js"
import { PROFILE_LIMIT } from "../lib/kidsMerge.js"
import { localDayKey } from "../lib/dates.js"
import { useAuth } from "../state/AuthContext.jsx"
import { useSync } from "../state/SyncContext.jsx"
import { useApp } from "../state/useApp.js"
import { kidSay, kidSaySpeech, playSfx, stopKidsAudio, unlockKidsAudio } from "../lib/kidsAudio.js"
import Celebration from "../components/kids/Celebration.jsx"
import LearnMode from "./kids/LearnMode.jsx"
import ListenGame from "./kids/ListenGame.jsx"
import GuessGame from "./kids/GuessGame.jsx"
import SpellGame from "./kids/SpellGame.jsx"
import MatchGame from "./kids/MatchGame.jsx"
import StoryMode from "./kids/StoryMode.jsx"
import CountGame from "./kids/CountGame.jsx"
import LetterGame from "./kids/LetterGame.jsx"
import WriteBoard from "./kids/WriteBoard.jsx"

const LANGUAGES = [
  { id: "id", label: "Indonesia", flag: "🇮🇩" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ar", label: "العربية", flag: "🕌" }
]

const GAMES = [
  { id: "listen", emoji: "🎧", name: "Dengar & Pilih", desc: "Dengarkan suara, pilih gambarnya", color: "#4f8cff" },
  { id: "guess", emoji: "🔍", name: "Tebak Kata", desc: "Lihat gambar, pilih tulisannya", color: "#ffab3d" },
  { id: "letter", emoji: "🅰️", name: "Huruf Awal", desc: "Tebak huruf pertama kata Inggris", color: "#0ea5e9" },
  { id: "spell", emoji: "✏️", name: "Susun Kata", desc: "Susun huruf jadi kata Inggris", color: "#a06bff" },
  { id: "match", emoji: "🧩", name: "Cocokkan Kartu", desc: "Temukan pasangan yang sama", color: "#ff7aa2" },
  { id: "count", emoji: "🔢", name: "Hitung Yuk", desc: "Hitung gambar, pilih angkanya", color: "#39c98c" }
]

const ACTIVITY_GOAL = 3

function bestLabel(game, best) {
  const value = best[game.id] || 0
  if (!value) return "belum dicoba"
  if (game.id === "match") return "sudah selesai ✅"
  return `rekor ${value}`
}

/** Mode Anak: belajar bergambar dengan suara + lima permainan + stiker + level. */
export default function Kids() {
  const {
    kids,
    kidsDoc,
    profiles,
    activeProfileId,
    addProfile,
    switchProfile,
    renameProfile,
    addStars,
    unlockSticker,
    markLearned,
    finishTopic,
    readStory,
    recordBest,
    recordMistake,
    forgetMistake,
    setSetting,
    setLastTopic,
    hydrate,
    replace,
    logActivity,
    claimDaily,
    reset
  } = useKidsProgress()

  const [screen, setScreen] = useState({ name: "home" })
  const [celebration, setCelebration] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [gain, setGain] = useState(null)
  const [query, setQuery] = useState("")
  const [topicFilter, setTopicFilter] = useState("all")

  const { user, configured: loginReady } = useAuth()
  const { queue: queueAccount, session } = useSync()
  const { actions: appActions } = useApp()
  const userId = user ? user.uid : ""
  const appliedSession = useRef(0)

  const settings = kids.settings
  const lang = settings.lang || "id"
  const slow = settings.slow === true
  const stars = kids.stars || 0
  const levelInfo = levelProgress(stars)
  const today = localDayKey()
  const daily =
    kids.daily && kids.daily.day === today
      ? kids.daily
      : { day: today, activities: 0, goal: kids.daily?.goal || ACTIVITY_GOAL, claimed: 0 }
  const goal = daily.goal || ACTIVITY_GOAL
  const activities = daily.activities || 0
  const missionDone = activities >= goal
  const streak = kids.streak && kids.streak.count ? kids.streak.count : 0

  useEffect(() => {
    if (!confirmReset) return undefined
    const timer = setTimeout(() => setConfirmReset(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmReset])

  // Hentikan suara saat berpindah layar.
  useEffect(() => {
    return () => stopKidsAudio()
  }, [screen.name, screen.topicId])

  // Mulai tiap layar dari atas agar judul tidak tertutup header lengket.
  useEffect(() => {
    if (typeof window === "undefined") return
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [screen.name, screen.topicId])

  // Animasi "+N ⭐" saat bintang bertambah.
  const previousStars = useRef(stars)
  useEffect(() => {
    const diff = stars - previousStars.current
    previousStars.current = stars
    if (diff <= 0) return undefined
    const key = Date.now()
    setGain({ amount: diff, key })
    const timer = setTimeout(() => setGain(null), 1500)
    return () => clearTimeout(timer)
  }, [stars])

  // Terapkan progres anak dari akun. Progres lokal hanya digabung ke akun yang sama.
  useEffect(() => {
    if (!session.ready || !session.version || appliedSession.current === session.version) return
    appliedSession.current = session.version
    const remote = session.account && session.account.kids
    if (session.switched) {
      // Akun berbeda di perangkat ini: progres akun sebelumnya tidak dibawa.
      replace(remote && typeof remote === "object" ? remote : null)
    } else if (remote) {
      // Semua profil digabung; profil yang di-reset lebih baru menang.
      // Reset yang dilakukan sebelum akun pertama kali terhubung tidak menghapus akun.
      hydrate(remote, { firstLogin: session.firstLogin })
    }
  }, [session, hydrate, replace])

  // Keluar dari akun: buang progres anak milik akun itu dari perangkat.
  const wasSignedIn = useRef(false)
  useEffect(() => {
    if (userId) {
      wasSignedIn.current = true
      return
    }
    if (!wasSignedIn.current) return
    wasSignedIn.current = false
    replace(null)
  }, [userId, replace])

  // Kirim perubahan progres anak ke akun, setelah data akun diterapkan.
  useEffect(() => {
    if (!session.ready || appliedSession.current !== session.version) return
    queueAccount({ kids: kidsDoc })
  }, [kidsDoc, session.ready, session.version, queueAccount])

  const showWin = useCallback(payload => {
    playSfx("win")
    setCelebration({ ...payload, stamp: Date.now() })
  }, [])

  const award = useCallback(
    amount => {
      const value = Math.max(0, Math.round(Number(amount) || 0))
      if (!value) return { milestone: null, levelUp: null }
      const before = kids.stars || 0
      addStars(value)
      const crossed = KID_STAR_MILESTONES.filter(
        milestone => before < milestone.stars && before + value >= milestone.stars
      )
      crossed.forEach(milestone => unlockSticker(milestone.id))
      const beforeLevel = levelProgress(before).current
      const afterLevel = levelProgress(before + value).current
      return {
        milestone: crossed.length ? crossed[crossed.length - 1] : null,
        levelUp: afterLevel.level > beforeLevel.level ? afterLevel : null
      }
    },
    [kids.stars, addStars, unlockSticker]
  )

  const handleStar = useCallback(() => {
    award(1)
  }, [award])

  const handleGameWin = useCallback(
    payload => {
      if (payload.gameId) recordBest(payload.gameId, payload.score || 0)
      if (payload.stickerId) unlockSticker(payload.stickerId)
      const { milestone, levelUp } = award(payload.stars || 0)
      logActivity()
      showWin({
        title: levelUp ? `Naik level! ${levelUp.avatar}` : payload.title,
        subtitle: levelUp
          ? `Kamu sekarang ${levelUp.title}. Terus semangat belajar ya!`
          : payload.subtitle,
        stickerId: payload.stickerId || (milestone ? milestone.id : null),
        emoji: levelUp ? levelUp.avatar : null,
        stars: payload.stars || 0
      })
    },
    [recordBest, unlockSticker, award, logActivity, showWin]
  )

  const handleTopicDone = useCallback(
    topic => {
      const firstTime = !kids.topicsDone[topic.id]
      finishTopic(topic.id)
      logActivity()
      if (firstTime) {
        const stickerId = `topic-${topic.id}`
        unlockSticker(stickerId)
        const { milestone, levelUp } = award(3)
        showWin({
          title: levelUp ? `Naik level! ${levelUp.avatar}` : `${topic.label} selesai!`,
          subtitle: levelUp
            ? `Kamu sekarang ${levelUp.title}. Topik ${topic.label} juga selesai!`
            : "Kamu sudah mengenal semua kata di topik ini.",
          stickerId: milestone ? milestone.id : stickerId,
          emoji: levelUp ? levelUp.avatar : null,
          stars: 3
        })
      } else {
        award(1)
        showWin({
          title: "Belajar ulang itu hebat!",
          subtitle: `Kamu mengulang topik ${topic.label}.`,
          stars: 1
        })
      }
    },
    [kids.topicsDone, finishTopic, logActivity, unlockSticker, award, showWin]
  )

  const handleStoryDone = useCallback(
    (story, result) => {
      const firstTime = !kids.stories[story.id]
      readStory(story.id)
      logActivity()
      if (firstTime) {
        const stickerId = `story-${story.id}`
        unlockSticker(stickerId)
        const { milestone, levelUp } = award(4)
        showWin({
          title: levelUp ? `Naik level! ${levelUp.avatar}` : `Cerita ${story.title} selesai!`,
          subtitle: `Kuis pemahaman: ${result.correct}/${result.total} benar.`,
          stickerId: milestone ? milestone.id : stickerId,
          emoji: levelUp ? levelUp.avatar : null,
          stars: 4
        })
      } else {
        award(1)
        showWin({
          title: "Baca ulang itu hebat!",
          subtitle: `Kamu membaca lagi cerita ${story.title}.`,
          stars: 1
        })
      }
    },
    [kids.stories, readStory, logActivity, unlockSticker, award, showWin]
  )

  const handleClaim = useCallback(() => {
    if (daily.claimed || !missionDone) return
    claimDaily()
    const { milestone } = award(5)
    showWin({
      title: "Misi hari ini tuntas! 🎁",
      subtitle: `Kamu menyelesaikan ${goal} aktivitas belajar hari ini.`,
      stickerId: milestone ? milestone.id : null,
      emoji: "🎁",
      stars: 5
    })
  }, [daily, missionDone, claimDaily, award, showWin, goal])

  const goHome = useCallback(() => {
    stopKidsAudio()
    setScreen({ name: "home" })
  }, [])

  const openTopic = useCallback(
    topicId => {
      unlockKidsAudio()
      playSfx("pop")
      setLastTopic(topicId)
      setScreen({ name: "learn", topicId })
    },
    [setLastTopic]
  )

  const openGame = useCallback(gameId => {
    unlockKidsAudio()
    playSfx("pop")
    setScreen({ name: gameId })
  }, [])

  const openWriting = useCallback(() => {
    unlockKidsAudio()
    playSfx("pop")
    setScreen({ name: "write" })
  }, [])

  const openStory = useCallback(storyId => {
    unlockKidsAudio()
    playSfx("pop")
    setScreen({ name: "story", storyId })
  }, [])

  const toggleSound = useCallback(() => {
    const next = !settings.sound
    setSetting("sound", next)
    if (next) {
      unlockKidsAudio()
      playSfx("pop")
    } else {
      stopKidsAudio()
    }
  }, [settings.sound, setSetting])

  const handleAddProfile = useCallback(() => {
    if (profiles.length >= PROFILE_LIMIT) return
    const name = window.prompt("Nama anak baru (maksimal 40 huruf)?")
    if (!name || !name.trim()) return
    unlockKidsAudio()
    playSfx("tap")
    addProfile(name)
  }, [addProfile, profiles.length])

  const handleRenameProfile = useCallback(() => {
    const current = profiles.find(profile => profile.id === activeProfileId)
    if (!current) return
    const name = window.prompt("Nama baru untuk profil ini?", current.name)
    if (!name || !name.trim() || name.trim() === current.name) return
    renameProfile(current.id, name)
  }, [profiles, activeProfileId, renameProfile])

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      playSfx("tap")
      setConfirmReset(true)
      return
    }
    reset()
    setConfirmReset(false)
    setCelebration(null)
    playSfx("pop")
  }, [confirmReset, reset])

  const resumeTopic = useMemo(
    () =>
      TOPIC_MAP[kids.lastTopic] ||
      KID_TOPICS.find(topic => !kids.topicsDone[topic.id]) ||
      KID_TOPICS[0],
    [kids.lastTopic, kids.topicsDone]
  )

  const topicGroups = useMemo(() => {
    const placed = new Set()
    const groups = KID_TOPIC_GROUPS.map(group => {
      const topics = group.ids.map(id => TOPIC_MAP[id]).filter(Boolean)
      topics.forEach(topic => placed.add(topic.id))
      return { ...group, topics }
    })
    const rest = KID_TOPICS.filter(topic => !placed.has(topic.id))
    if (rest.length) groups.push({ id: "lainnya", emoji: "✨", title: "Lainnya", topics: rest })
    return groups.filter(group => group.topics.length)
  }, [])
  const totalWords = useMemo(
    () => KID_TOPICS.reduce((sum, topic) => sum + topic.items.length, 0),
    []
  )
  const resumeInfo = useMemo(() => {
    const learned = resumeTopic.items.filter(entry => kids.learned[entry.key]).length
    const total = resumeTopic.items.length
    return { learned, total, percent: total ? Math.round((learned / total) * 100) : 0 }
  }, [resumeTopic, kids.learned])

  // Pencarian lintas topik: nama topik, kata Indonesia/Inggris/Arab, atau transliterasi.
  const search = query.trim().toLowerCase()
  const searchActive = search.length >= 2
  const searchHits = useMemo(() => {
    if (search.length < 2) return []
    const hits = []
    for (const topic of KID_TOPICS) {
      for (const entry of topic.items) {
        const fields = [entry.id, entry.en, entry.ar, entry.tr]
        if (!fields.some(value => String(value || "").toLowerCase().includes(search))) continue
        hits.push({ ...entry, topicId: topic.id, topicLabel: topic.label, topicEmoji: topic.emoji })
        if (hits.length >= 18) return hits
      }
    }
    return hits
  }, [search])
  const hitTopicIds = useMemo(() => new Set(searchHits.map(hit => hit.topicId)), [searchHits])
  const visibleGroups = useMemo(() => {
    const matchesFilter = topic =>
      topicFilter === "all"
        ? true
        : topicFilter === "done"
          ? Boolean(kids.topicsDone[topic.id])
          : !kids.topicsDone[topic.id]
    return topicGroups
      .map(group => ({
        ...group,
        topics: group.topics.filter(topic => {
          if (!matchesFilter(topic)) return false
          if (!searchActive) return true
          return (
            hitTopicIds.has(topic.id) || `${topic.label} ${topic.blurb}`.toLowerCase().includes(search)
          )
        })
      }))
      .filter(group => group.topics.length)
  }, [topicGroups, searchActive, hitTopicIds, search, topicFilter, kids.topicsDone])
  const groupStats = useMemo(
    () =>
      topicGroups.map(group => {
        const total = group.topics.reduce((sum, topic) => sum + topic.items.length, 0)
        const learned = group.topics.reduce(
          (sum, topic) => sum + topic.items.filter(entry => kids.learned[entry.key]).length,
          0
        )
        return {
          id: group.id,
          emoji: group.emoji,
          title: group.title,
          total,
          learned,
          percent: total ? Math.round((learned / total) * 100) : 0
        }
      }),
    [topicGroups, kids.learned]
  )
  const mastered = groupStats.reduce((sum, group) => sum + group.learned, 0)
  const masteryPercent = totalWords ? Math.round((mastered / totalWords) * 100) : 0
  const topStars = Math.max(1, ...profiles.map(profile => profile.stars || 0))

  // Enam kata pilihan yang berganti tiap minggu, dipilih deterministik dari tanggal.
  // Kata sulit: kata yang pernah dijawab salah di permainan, diurutkan dari yang tersering.
  const hardWords = useMemo(() => {
    const list = []
    for (const [signature, info] of Object.entries(kids.mistakes || {})) {
      const separator = signature.indexOf(":")
      if (separator < 1) continue
      const topicId = signature.slice(0, separator)
      const key = signature.slice(separator + 1)
      const topic = TOPIC_MAP[topicId]
      const entry = topic && topic.items.find(item => item.key === key)
      if (!topic || !entry) continue
      list.push({
        ...entry,
        signature,
        topicId,
        topicLabel: topic.label,
        topicColor: topic.color,
        count: (info && info.count) || 1,
        at: (info && info.at) || 0
      })
    }
    return list.sort((a, b) => b.count - a.count || b.at - a.at)
  }, [kids.mistakes])
  const hardTopic = useMemo(
    () => ({
      id: "__hard",
      label: "Kata Sulit",
      emoji: "🩹",
      color: "#ef4444",
      blurb: "Kata yang sering salah",
      items: hardWords.map(word => {
        const { signature, topicId, topicLabel, topicColor, count, at, ...entry } = word
        return entry
      })
    }),
    [hardWords]
  )

  const handleHardDone = useCallback(() => {
    logActivity()
    award(2)
    showWin({
      title: "Latihan kata sulit selesai! 🩹",
      subtitle: `Kamu mengulang ${hardWords.length} kata yang pernah salah.`,
      stars: 2
    })
  }, [hardWords.length, logActivity, award, showWin])

  const weekWords = useMemo(() => {
    const pool = KID_PLAY_ITEMS.filter(entry => entry.emoji && entry.emoji !== "🔢")
    const start = new Date(new Date().getFullYear(), 0, 1).getTime()
    const week = Math.floor((Date.now() - start) / (7 * 24 * 60 * 60 * 1000))
    const picked = []
    const seen = new Set()
    for (let step = 0; step < pool.length && picked.length < 6; step += 1) {
      const entry = pool[(week * 11 + step * 17) % pool.length]
      const signature = `${entry.topic}:${entry.key}`
      if (seen.has(signature)) continue
      seen.add(signature)
      picked.push(entry)
    }
    return picked
  }, [])

  const doneTopics = Object.keys(kids.topicsDone).length
  const stickerCount = Object.keys(kids.stickers).length
  const readCount = Object.keys(kids.stories).length

  if (screen.name === "learn") {
    const topic =
      screen.topicId === "__hard" ? hardTopic : TOPIC_MAP[screen.topicId] || KID_TOPICS[0]
    return (
      <div className="kids">
        <div className="kid-deco" aria-hidden>
          <span>☁️</span>
          <span>🌈</span>
          <span>⭐</span>
          <span>🎈</span>
        </div>
        <LearnMode
          topic={topic}
          settings={settings}
          onBack={goHome}
          onSeen={markLearned}
          onDone={() => (screen.topicId === "__hard" ? handleHardDone() : handleTopicDone(topic))}
        />
        {celebration ? <Celebration data={celebration} onClose={() => setCelebration(null)} /> : null}
      </div>
    )
  }

  if (screen.name !== "home") {
    return (
      <div className="kids">
        <div className="kid-deco" aria-hidden>
          <span>☁️</span>
          <span>🌈</span>
          <span>⭐</span>
          <span>🎈</span>
        </div>
        {screen.name === "story" ? (
          <StoryMode
            story={STORY_MAP[screen.storyId] || KID_STORIES[0]}
            settings={settings}
            onBack={goHome}
            onFinish={result => handleStoryDone(STORY_MAP[screen.storyId] || KID_STORIES[0], result)}
          />
        ) : null}
        {screen.name === "listen" ? (
          <ListenGame
            settings={settings}
            onBack={goHome}
            onStar={handleStar}
            onWin={handleGameWin}
            onMistake={recordMistake}
          />
        ) : null}
        {screen.name === "guess" ? (
          <GuessGame
            settings={settings}
            onBack={goHome}
            onStar={handleStar}
            onWin={handleGameWin}
            onMistake={recordMistake}
          />
        ) : null}
        {screen.name === "spell" ? (
          <SpellGame
            settings={settings}
            onBack={goHome}
            onStar={handleStar}
            onWin={handleGameWin}
            onMistake={recordMistake}
          />
        ) : null}
        {screen.name === "match" ? (
          <MatchGame settings={settings} onBack={goHome} onStar={handleStar} onWin={handleGameWin} />
        ) : null}
        {screen.name === "count" ? (
          <CountGame
            settings={settings}
            onBack={goHome}
            onStar={handleStar}
            onWin={handleGameWin}
            onMistake={recordMistake}
          />
        ) : null}
        {screen.name === "letter" ? (
          <LetterGame
            settings={settings}
            onBack={goHome}
            onStar={handleStar}
            onWin={handleGameWin}
            onMistake={recordMistake}
          />
        ) : null}
        {screen.name === "write" ? (
          <WriteBoard letters={TOPIC_MAP.hijaiyah.items} onBack={goHome} />
        ) : null}
        {celebration ? <Celebration data={celebration} onClose={() => setCelebration(null)} /> : null}
      </div>
    )
  }

  return (
    <div className="kids">
      <div className="kid-deco" aria-hidden>
        <span>☁️</span>
        <span>🌈</span>
        <span>⭐</span>
        <span>🎈</span>
      </div>

      <header className="kid-head">
        <button
          className="kid-mascot"
          onClick={() => {
            unlockKidsAudio()
            playSfx("pop")
            kidSay("Hai teman! Aku Burhan si burung hantu. Ayo belajar sambil bermain!", "id")
          }}
          aria-label="Dengarkan sapaan Burhan"
        >
          <span className="kid-mascot-emoji" aria-hidden>
            🦉
          </span>
          <span className="kid-mascot-bubble">Hai, teman! 👋</span>
        </button>

        <div className="kid-hello">
          <h2>Ayo belajar sambil bermain!</h2>
          <p>
            Dengarkan suaranya, tirukan, lalu mainkan permainannya. Kumpulkan bintang ⭐, naik level, dan
            buka stiker rahasia! 🏅
          </p>
          <div className="kid-cta">
            <button className="kid-btn kid-btn-primary kid-btn-lg" onClick={() => openTopic(resumeTopic.id)}>
              {kids.lastTopic ? "Lanjutkan belajar 🚀" : "Mulai belajar 🚀"}
            </button>
            <button className="kid-btn kid-btn-ghost" onClick={() => openGame("listen")}>
              Tebak suara 🎧
            </button>
          </div>

          <div className="kid-level">
            <span className="kid-level-avatar" aria-hidden>
              {levelInfo.current.avatar}
            </span>
            <div className="kid-level-copy">
              <span className="kid-level-title">
                Level {levelInfo.current.level} · {levelInfo.current.title}
              </span>
              <span className="kid-level-bar">
                <span style={{ width: `${levelInfo.percent}%` }} />
              </span>
              <span className="kid-level-hint">
                {levelInfo.next
                  ? `${levelInfo.next.min - stars} ⭐ lagi ke level ${levelInfo.next.level} (${levelInfo.next.avatar} ${levelInfo.next.title})`
                  : "Level maksimal! Kamu luar biasa 🎉"}
              </span>
            </div>
          </div>
        </div>

        <div className="kid-stats">
          <div className="kid-stat">
            <span className="kid-stat-value">⭐ {stars}</span>
            <span className="kid-stat-label">bintang</span>
            {gain ? (
              <span key={gain.key} className="kid-star-pop" aria-hidden>
                +{gain.amount} ⭐
              </span>
            ) : null}
          </div>
          <div className="kid-stat">
            <span className="kid-stat-value">🔥 {streak}</span>
            <span className="kid-stat-label">hari beruntun</span>
          </div>
          <div className="kid-stat">
            <span className="kid-stat-value">
              {doneTopics}/{KID_TOPICS.length}
            </span>
            <span className="kid-stat-label">topik</span>
          </div>
        </div>
      </header>

      <section className="kid-resume" style={{ "--kid-accent": resumeTopic.color }}>
        <span className="kid-resume-art" aria-hidden>
          {resumeTopic.emoji}
        </span>
        <div className="kid-resume-copy">
          <span className="kid-resume-kicker">
            {kids.lastTopic ? "🧭 Lanjutkan belajar" : "🌟 Mulai petualangan"}
          </span>
          <strong className="kid-resume-title">{resumeTopic.label}</strong>
          <span className="kid-resume-meta">
            {resumeInfo.learned}/{resumeInfo.total} kata dikenal · {resumeTopic.blurb}
          </span>
          <span className="kid-resume-bar">
            <span style={{ width: `${resumeInfo.percent}%` }} />
          </span>
        </div>
        <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={() => openTopic(resumeTopic.id)}>
          {resumeInfo.learned ? "Lanjut →" : "Buka →"}
        </button>
      </section>

      {hardWords.length ? (
        <section className="kid-hard">
          <div className="kid-hard-head">
            <span className="kid-hard-emoji" aria-hidden>
              🩹
            </span>
            <div className="kid-hard-copy">
              <strong>Kata sulit · {hardWords.length}</strong>
              <span>Kumpulan kata yang pernah salah di permainan. Ulangi sampai hafal.</span>
            </div>
            <button
              className="kid-btn kid-btn-primary kid-btn-sm"
              onClick={() => {
                unlockKidsAudio()
                playSfx("pop")
                setScreen({ name: "learn", topicId: "__hard" })
              }}
            >
              Ulangi sekarang →
            </button>
          </div>
          <div className="kid-hard-list">
            {hardWords.slice(0, 10).map(word => (
              <span key={word.signature} className="kid-hard-chip">
                <button
                  className="kid-hard-word"
                  onClick={() => {
                    playSfx("pop")
                    kidSaySpeech({ text: word[lang] || word.en, lang, latin: word.tr }, { slow })
                  }}
                  title={`Dengarkan ${word[lang] || word.en}`}
                >
                  <span aria-hidden>{word.emoji}</span>{" "}
                  <span className={lang === "ar" ? "kid-word-ar" : ""}>{word[lang] || word.en}</span>
                </button>
                <span className="kid-hard-count" aria-label={`salah ${word.count} kali`}>
                  ×{word.count}
                </span>
                <button
                  className="kid-hard-forget"
                  onClick={() => forgetMistake(word.signature)}
                  aria-label={`Tandai ${word[lang] || word.en} sudah bisa`}
                  title="Sudah bisa, hapus dari daftar"
                >
                  ✓
                </button>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="kid-tools kid-profiles">
        <span className="kid-tools-label">Profil anak:</span>
        {profiles.map(profile => (
          <button
            key={profile.id}
            className={`kid-chip ${profile.id === activeProfileId ? "on" : ""}`}
            onClick={() => {
              if (profile.id !== activeProfileId) {
                previousStars.current = profile.stars
                setGain(null)
              }
              unlockKidsAudio()
              playSfx("tap")
              switchProfile(profile.id)
            }}
            aria-pressed={profile.id === activeProfileId}
            title={`${profile.stars} bintang`}
          >
            {profile.avatar} {profile.name}
          </button>
        ))}
        {profiles.length < PROFILE_LIMIT ? (
          <button className="kid-chip" onClick={handleAddProfile}>
            ＋ Tambah anak
          </button>
        ) : null}
        <button className="kid-chip" onClick={handleRenameProfile}>
          ✏️ Ganti nama
        </button>
      </div>

      <div className="kid-tools">
        <span className="kid-tools-label">Panjang permainan:</span>
        {KID_ROUND_OPTIONS.map(option => (
          <button
            key={option.id}
            className={`kid-chip ${settings.length === option.id || (!settings.length && option.id === "normal") ? "on" : ""}`}
            onClick={() => {
              playSfx("tap")
              setSetting("length", option.id)
            }}
            aria-pressed={(settings.length || "normal") === option.id}
            title={option.hint}
          >
            <span aria-hidden>{option.emoji}</span> {option.label}
          </button>
        ))}
      </div>

      <div className="kid-tools">
        <span className="kid-tools-label">Bahasa kata:</span>
        {LANGUAGES.map(language => (
          <button
            key={language.id}
            className={`kid-chip ${settings.lang === language.id ? "on" : ""}`}
            onClick={() => {
              unlockKidsAudio()
              playSfx("tap")
              setSetting("lang", language.id)
            }}
            aria-pressed={settings.lang === language.id}
          >
            <span aria-hidden>{language.flag}</span> {language.label}
          </button>
        ))}
        <span className="kid-tools-gap" />
        <button
          className={`kid-chip ${settings.slow ? "on" : ""}`}
          onClick={() => {
            playSfx("tap")
            setSetting("slow", !settings.slow)
          }}
          aria-pressed={settings.slow}
        >
          🐢 Suara pelan
        </button>
        <button
          className={`kid-chip ${settings.sound ? "on" : ""}`}
          onClick={toggleSound}
          aria-pressed={settings.sound}
        >
          {settings.sound ? "🔊 Suara nyala" : "🔇 Suara mati"}
        </button>
        {!user && loginReady ? (
          <button className="kid-chip" onClick={() => appActions.setUi({ accountOpen: true })}>
            ☁️ Masuk untuk simpan skor
          </button>
        ) : null}
        <button className="kid-chip kid-chip-danger" onClick={handleReset}>
          {confirmReset ? "Yakin? Ketuk lagi" : "🔄 Ulangi progres"}
        </button>
      </div>

      <section className={`kid-mission ${missionDone ? "ready" : ""}`}>
        <div className="kid-mission-head">
          <span className="kid-mission-emoji" aria-hidden>
            🎯
          </span>
          <div className="kid-mission-copy">
            <h3>Misi hari ini</h3>
            <p>Selesaikan {goal} aktivitas belajar (topik atau permainan).</p>
          </div>
          <span className="kid-mission-count">
            {Math.min(activities, goal)}/{goal}
          </span>
        </div>
        <div className="kid-mission-dots" aria-hidden>
          {Array.from({ length: goal }, (_, index) => (
            <span key={index} className={index < activities ? "on" : ""}>
              ★
            </span>
          ))}
        </div>
        <div className="kid-mission-foot">
          <span className="kid-mission-reward">Hadiah: 5 ⭐</span>
          {daily.claimed ? (
            <span className="kid-mission-claimed">✅ Hadiah sudah diambil</span>
          ) : (
            <button
              className="kid-btn kid-btn-primary kid-btn-sm"
              onClick={handleClaim}
              disabled={!missionDone}
            >
              {missionDone ? "Klaim hadiah 🎁" : "Selesaikan misi dulu"}
            </button>
          )}
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              🎮
            </span>{" "}
            Mainkan dulu, yuk!
          </h3>
          <span className="kid-section-sub">Enam permainan seru dengan suara</span>
        </div>
        <div className="kid-games">
          {GAMES.map(game => (
            <button
              key={game.id}
              className="kid-game-card"
              style={{ "--kid-accent": game.color }}
              onClick={() => openGame(game.id)}
            >
              <span className="kid-game-emoji" aria-hidden>
                {game.emoji}
              </span>
              <span className="kid-game-body">
                <span className="kid-game-name">{game.name}</span>
                <span className="kid-game-desc">{game.desc}</span>
                <span className="kid-game-best">{bestLabel(game, kids.best)}</span>
              </span>
              <span className="kid-game-arrow" aria-hidden>
                ▶
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              🌟
            </span>{" "}
            Kata baru minggu ini
          </h3>
          <span className="kid-section-sub">6 kata pilihan · berganti tiap minggu</span>
        </div>
        <div className="kid-weekly">
          {weekWords.map(entry => (
            <div
              key={`${entry.topic}-${entry.key}`}
              className="kid-weekly-card"
              style={{ "--kid-accent": TOPIC_MAP[entry.topic]?.color }}
            >
              <span className="kid-weekly-emoji" aria-hidden>
                {entry.emoji}
              </span>
              <span className={`kid-weekly-word ${lang === "ar" ? "kid-word-ar" : ""}`}>
                {entry[lang] || entry.en}
              </span>
              <span className="kid-weekly-sub">
                {entry.id} · {entry.en}
              </span>
              <span className="kid-weekly-actions">
                <button
                  className="kid-weekly-speak"
                  onClick={() => {
                    playSfx("pop")
                    kidSaySpeech({ text: entry[lang] || entry.en, lang, latin: entry.tr }, { slow })
                  }}
                  aria-label={`Dengarkan ${entry[lang] || entry.en}`}
                >
                  🔊
                </button>
                <button className="kid-weekly-topic" onClick={() => openTopic(entry.topic)}>
                  {entry.topicLabel} →
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              📖
            </span>{" "}
            Cerita bergambar
          </h3>
          <span className="kid-section-sub">
            {readCount}/{KID_STORIES.length} cerita dibaca · bertutur 3 bahasa
          </span>
        </div>
        <div className="kid-stories">
          {KID_STORIES.map(story => {
            const wasRead = !!kids.stories[story.id]
            return (
              <button
                key={story.id}
                className={`kid-story-tile ${wasRead ? "done" : ""}`}
                style={{ "--kid-accent": story.color }}
                onClick={() => openStory(story.id)}
              >
                <span className="kid-story-cover" aria-hidden>
                  {story.cover.map((emoji, position) => (
                    <span key={position}>{emoji}</span>
                  ))}
                </span>
                <span className="kid-story-body">
                  <span className="kid-story-title">
                    {story.title}
                    {wasRead ? <span className="kid-topic-done"> ✓</span> : null}
                  </span>
                  <span className="kid-story-meta">
                    {story.level} · {story.sentences.length} kalimat
                  </span>
                </span>
                <span className="kid-game-arrow" aria-hidden>
                  ▶
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-write-banner">
          <span className="kid-write-banner-art" aria-hidden>
            ✍️
          </span>
          <div className="kid-write-banner-copy">
            <strong>Latihan menulis huruf Arab</strong>
            <span>28 huruf hijaiyah dengan huruf contoh besar dan papan tulis sentuh.</span>
          </div>
          <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={openWriting}>
            Coba tulis →
          </button>
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              🗂️
            </span>{" "}
            Pilih topik belajar
          </h3>
          <span className="kid-section-sub">
            {KID_TOPICS.length} topik · {totalWords} kata bergambar
          </span>
        </div>
        <div className="kid-search">
          <span className="kid-search-icon" aria-hidden>
            🔎
          </span>
          <input
            className="kid-search-input"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Cari kata atau topik, misal: kucing, apple, قطة"
            aria-label="Cari kata atau topik"
          />
          {query ? (
            <button className="kid-search-clear" onClick={() => setQuery("")} aria-label="Hapus pencarian">
              ✕
            </button>
          ) : null}
        </div>

        <div className="kid-filters" role="group" aria-label="Saring topik">
          {[
            { id: "all", label: "Semua topik" },
            { id: "todo", label: "Belum selesai" },
            { id: "done", label: "Sudah selesai" }
          ].map(filter => (
            <button
              key={filter.id}
              className={`kid-chip ${topicFilter === filter.id ? "on" : ""}`}
              onClick={() => {
                playSfx("tap")
                setTopicFilter(filter.id)
              }}
              aria-pressed={topicFilter === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {searchActive ? (
          <div className="kid-search-hits">
            <div className="kid-search-hits-head">
              <strong>Hasil kata</strong>
              <span>{searchHits.length ? `${searchHits.length} kata cocok` : "tidak ada"}</span>
            </div>
            {searchHits.length ? (
              <div className="kid-search-list">
                {searchHits.map(hit => (
                  <button
                    key={`${hit.topicId}-${hit.key}`}
                    className="kid-search-hit"
                    style={{ "--kid-accent": TOPIC_MAP[hit.topicId]?.color }}
                    onClick={() => {
                      playSfx("pop")
                      kidSaySpeech(
                        { text: hit[lang] || hit.en, lang, latin: hit.tr },
                        { slow }
                      )
                    }}
                    title={`Dengarkan ${hit[lang] || hit.en}`}
                  >
                    <span className="kid-search-hit-emoji" aria-hidden>
                      {hit.emoji}
                    </span>
                    <span className="kid-search-hit-body">
                      <strong className={lang === "ar" ? "kid-word-ar" : ""}>{hit[lang] || hit.en}</strong>
                      <span>
                        {hit.id} · {hit.en}
                      </span>
                    </span>
                    <span className="kid-search-hit-topic">
                      {hit.topicEmoji} {hit.topicLabel}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="kid-search-empty">Belum ada yang cocok. Coba kata lain ya 🙂</p>
            )}
          </div>
        ) : null}

        {!visibleGroups.length ? (
          <p className="kid-search-empty">
            Tidak ada topik pada filter ini. Coba pilih “Semua topik” atau kata pencarian lain.
          </p>
        ) : null}

        <div className="kid-topic-groups">
          {visibleGroups.map(group => (
            <section key={group.id} className="kid-topic-group">
              <div className="kid-topic-group-head">
                <h4>
                  <span aria-hidden>{group.emoji}</span> {group.title}
                </h4>
                <span className="kid-topic-group-count">{group.topics.length} topik</span>
              </div>
              <div className="kid-topics">
                {group.topics.map(topic => {
                  const learned = topic.items.filter(entry => kids.learned[entry.key]).length
                  const percent = Math.round((learned / topic.items.length) * 100)
                  const finished = !!kids.topicsDone[topic.id]
                  return (
                    <button
                      key={topic.id}
                      className={`kid-topic ${finished ? "done" : ""}`}
                      style={{ "--kid-accent": topic.color }}
                      onClick={() => openTopic(topic.id)}
                    >
                      <span className="kid-topic-top">
                        <span className="kid-topic-emoji" aria-hidden>
                          {topic.emoji}
                        </span>
                        <span className={`kid-topic-percent ${percent === 100 ? "full" : ""}`}>
                          {percent === 100 ? "✓" : `${percent}%`}
                        </span>
                      </span>
                      <span className="kid-topic-name">
                        {topic.label}
                        {finished ? (
                          <span className="kid-topic-done" aria-label="selesai">
                            {" "}
                            ✓
                          </span>
                        ) : null}
                      </span>
                      <span className="kid-topic-blurb">{topic.blurb}</span>
                      <span className="kid-topic-bar">
                        <span style={{ width: `${percent}%` }} />
                      </span>
                      <span className="kid-topic-meta">
                        {learned}/{topic.items.length} kata
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="kid-section">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              🏅
            </span>{" "}
            Album stiker
          </h3>
          <span className="kid-section-sub">
            {stickerCount} dari {KID_STICKERS.length} terbuka
          </span>
        </div>
        <div className="kid-stickers">
          {KID_STICKERS.map(sticker => {
            const unlocked = !!kids.stickers[sticker.id]
            return (
              <div
                key={sticker.id}
                className={`kid-sticker ${unlocked ? "unlocked" : "locked"}`}
                title={unlocked ? sticker.name : sticker.hint}
              >
                <span className="kid-sticker-emoji" aria-hidden>
                  {unlocked ? sticker.emoji : "🔒"}
                </span>
                <span className="kid-sticker-name">{unlocked ? sticker.name : sticker.hint}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="kid-section kid-report">
        <div className="kid-section-head">
          <h3>
            <span className="kid-section-emoji" aria-hidden>
              📊
            </span>{" "}
            Laporan belajar
          </h3>
          <span className="kid-section-sub">ringkasan untuk orang tua</span>
          <button className="kid-btn kid-btn-ghost kid-btn-sm kid-print" onClick={() => window.print()}>
            🖨️ Cetak laporan
          </button>
        </div>
        <div className="kid-report-grid">
          <div className="kid-report-card">
            <span className="kid-report-value">
              {mastered}/{totalWords}
            </span>
            <span className="kid-report-label">kata dikuasai</span>
            <span className="kid-report-bar">
              <span style={{ width: `${masteryPercent}%` }} />
            </span>
          </div>
          <div className="kid-report-card">
            <span className="kid-report-value">
              {doneTopics}/{KID_TOPICS.length}
            </span>
            <span className="kid-report-label">topik selesai</span>
          </div>
          <div className="kid-report-card">
            <span className="kid-report-value">⭐ {stars}</span>
            <span className="kid-report-label">bintang terkumpul</span>
          </div>
          <div className="kid-report-card">
            <span className="kid-report-value">🔥 {streak}</span>
            <span className="kid-report-label">hari beruntun</span>
          </div>
        </div>
        <div className="kid-report-groups">
          {groupStats.map(group => (
            <div key={group.id} className="kid-report-group">
              <span className="kid-report-group-head">
                <span aria-hidden>{group.emoji}</span> {group.title}
              </span>
              <span className="kid-report-group-bar">
                <span style={{ width: `${group.percent}%` }} />
              </span>
              <span className="kid-report-group-meta">
                {group.learned}/{group.total}
              </span>
            </div>
          ))}
        </div>
        {profiles.length > 1 ? (
          <div className="kid-report-profiles">
            <span className="kid-report-profiles-title">Bintang tiap anak</span>
            {profiles.map(profile => (
              <div key={profile.id} className="kid-report-profile">
                <span className="kid-report-profile-name">
                  {profile.avatar} {profile.name}
                </span>
                <span className="kid-report-profile-bar">
                  <span style={{ width: `${Math.round(((profile.stars || 0) / topStars) * 100)}%` }} />
                </span>
                <span className="kid-report-profile-value">⭐ {profile.stars || 0}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <p className="kid-tip">
        💡 Tips untuk orang tua: dampingi anak 10–15 menit sehari. Setiap kata punya suara dalam bahasa
        Indonesia, Inggris, dan Arab — ketuk kartu untuk mengulang suaranya.
      </p>

      {celebration ? <Celebration data={celebration} onClose={() => setCelebration(null)} /> : null}
    </div>
  )
}
