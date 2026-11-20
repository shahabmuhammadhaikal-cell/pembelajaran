import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_PLAY_ITEMS } from "../../lib/kidsData.js"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"

const PAIRS = 6

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Cocokkan Kartu: cari pasangan gambar yang sama. */
export default function MatchGame({ settings, onBack, onStar, onWin }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const [seed, setSeed] = useState(0)
  const [open, setOpen] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)
  const wonRef = useRef(false)

  const deck = useMemo(() => {
    const unique = []
    const seenEmoji = new Set()
    for (const entry of shuffle(KID_PLAY_ITEMS)) {
      if (seenEmoji.has(entry.emoji)) continue
      seenEmoji.add(entry.emoji)
      unique.push(entry)
      if (unique.length >= PAIRS) break
    }
    const cards = unique.flatMap((entry, index) => [
      { uid: `${seed}-${index}-a`, pairKey: `${entry.key}|${entry.emoji}`, entry },
      { uid: `${seed}-${index}-b`, pairKey: `${entry.key}|${entry.emoji}`, entry }
    ])
    return shuffle(cards)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const flip = useCallback(
    card => {
      if (locked || done) return
      if (matched.includes(card.uid) || open.some(entry => entry.uid === card.uid)) return
      playSfx("tap")
      const nextOpen = [...open, card]
      setOpen(nextOpen)
      if (nextOpen.length < 2) return

      setMoves(previous => previous + 1)
      const [first, second] = nextOpen
      if (first.pairKey === second.pairKey) {
        const nextMatched = [...matched, first.uid, second.uid]
        setMatched(nextMatched)
        setOpen([])
        playSfx("correct")
        onStar()
        if (sound) kidSay(second.entry[lang], lang, { slow })
        if (nextMatched.length === deck.length) setDone(true)
      } else {
        setLocked(true)
        playSfx("wrong")
        timerRef.current = setTimeout(() => {
          setOpen([])
          setLocked(false)
          timerRef.current = null
        }, 780)
      }
    },
    [locked, done, matched, open, onStar, sound, lang, slow, deck.length]
  )

  const restart = useCallback(() => {
    wonRef.current = false
    playSfx("tap")
    if (timerRef.current) clearTimeout(timerRef.current)
    setSeed(previous => previous + 1)
    setOpen([])
    setMatched([])
    setMoves(0)
    setLocked(false)
    setDone(false)
  }, [])

  useEffect(() => {
    if (!done || wonRef.current) return
    wonRef.current = true
    onWin({
      gameId: "match",
      score: 1,
      stars: 2,
      stickerId: "game-match",
      title: "Puzzle selesai! 🧩",
      subtitle: `Semua pasangan ketemu dalam ${moves} langkah.`
    })
  }, [done, moves, onWin])

  const found = matched.length / 2

  return (
    <div className="kid-game">
      <div className="kid-subhead">
        <button className="kid-back" onClick={onBack}>
          <span aria-hidden>🏠</span> Beranda
        </button>
        <div className="kid-subtitle">🧩 Cocokkan Kartu</div>
        <button className="kid-back kid-back-right" onClick={restart}>
          Main lagi 🔄
        </button>
      </div>

      <div className="kid-match-info">
        <span className="kid-score-pill">🧩 {found}/{PAIRS}</span>
        <span className="kid-score-pill">👣 {moves} langkah</span>
        <span className="kid-match-tip">Balik dua kartu, cari gambar yang sama.</span>
      </div>

      <div className="kid-match-grid">
        {deck.map(card => {
          const isOpen = open.some(entry => entry.uid === card.uid)
          const isMatched = matched.includes(card.uid)
          return (
            <button
              key={card.uid}
              className={`kid-memo ${isOpen || isMatched ? "open" : ""} ${isMatched ? "matched" : ""}`}
              onClick={() => flip(card)}
              aria-label={isOpen || isMatched ? `${card.entry[lang]}` : "Kartu tertutup"}
              disabled={isMatched}
            >
              <span className="kid-memo-inner">
                <span className="kid-memo-front" aria-hidden>
                  ?
                </span>
                <span className="kid-memo-back">
                  <span className="kid-memo-emoji" aria-hidden>
                    {card.entry.emoji}
                  </span>
                  <span className="kid-memo-word">{card.entry[lang]}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {done ? (
        <div className="kid-feedback" aria-live="polite">
          <div className="kid-feedback-inner good">
            <span>Semua pasangan ketemu! 🎉</span>
            <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={restart}>
              Main lagi
            </button>
          </div>
        </div>
      ) : (
        <p className="kid-hint">Kartu yang cocok akan tetap terbuka. Semakin sedikit langkah, semakin hebat!</p>
      )}
    </div>
  )
}
