import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TOPIC_MAP } from "../../lib/kidsData.js"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS = 5
const OBJECTS = ["🍎", "🍌", "🐟", "⭐", "🎈", "🍓", "🐥", "🌸", "🍪", "🚗"]
const NUMBERS = TOPIC_MAP.numbers.items

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function numberWord(value, lang) {
  const found = NUMBERS.find(entry => entry.numeral === value)
  return found ? found[lang] || found.en : String(value)
}

/** Hitung Yuk: hitung gambar lalu pilih angka yang benar. */
export default function CountGame({ settings, onBack, onStar, onWin }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const [seed, setSeed] = useState(0)
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const wonRef = useRef(false)

  const rounds = useMemo(
    () =>
      Array.from({ length: ROUNDS }, () => {
        const count = 1 + Math.floor(Math.random() * 10)
        const emoji = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
        const choices = new Set([count])
        while (choices.size < 4) choices.add(1 + Math.floor(Math.random() * 10))
        return { count, emoji, options: shuffle([...choices]) }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed]
  )

  const current = rounds[round]

  const choose = useCallback(
    value => {
      if (done || solved || !current) return
      if (value === current.count) {
        setSolved(true)
        playSfx("correct")
        if (!wrong.length) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) kidSay(numberWord(current.count, lang), lang, { slow })
      } else {
        playSfx("wrong")
        setWrong(previous => (previous.includes(value) ? previous : [...previous, value]))
      }
    },
    [done, solved, current, wrong.length, onStar, sound, lang, slow]
  )

  const next = useCallback(() => {
    if (!solved) return
    playSfx("tap")
    if (round + 1 >= rounds.length) {
      setDone(true)
      return
    }
    setRound(previous => previous + 1)
    setWrong([])
    setSolved(false)
  }, [solved, round, rounds.length])

  const restart = useCallback(() => {
    wonRef.current = false
    playSfx("tap")
    setSeed(previous => previous + 1)
    setRound(0)
    setWrong([])
    setSolved(false)
    setScore(0)
    setDone(false)
  }, [])

  useEffect(() => {
    if (!done || wonRef.current) return
    wonRef.current = true
    onWin({
      gameId: "count",
      score,
      stars: 2,
      stickerId: "game-count",
      title: "Pandai berhitung! 🔢",
      subtitle: `Kamu menjawab benar ${score} dari ${rounds.length} soal.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🔢 Hitung Yuk</div>
          <span className="kid-counter">{score}/{ROUNDS}</span>
        </div>
        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= 4 ? "🏅" : "🌟"}
          </div>
          <h3>{score >= 4 ? "Kamu jago berhitung!" : "Kerja bagus!"}</h3>
          <p>
            Jawaban benar <b>{score}</b> dari <b>{rounds.length}</b>.
          </p>
          <div className="kid-actions">
            <button className="kid-btn kid-btn-primary" onClick={restart}>
              Main lagi 🔄
            </button>
            <button className="kid-btn kid-btn-ghost" onClick={onBack}>
              Pilih permainan lain
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="kid-game">
      <div className="kid-subhead">
        <button className="kid-back" onClick={onBack}>
          <span aria-hidden>🏠</span> Beranda
        </button>
        <div className="kid-subtitle">🔢 Hitung Yuk</div>
        <span className="kid-counter">
          {round + 1}/{ROUNDS}
        </span>
      </div>

      <div className="kid-prompt kid-prompt-count">
        <div className="kid-prompt-text">
          <strong>Ada berapa banyak?</strong>
          <span>Hitung gambarnya, lalu pilih angkanya.</span>
        </div>
        <span className="kid-score-pill">⭐ {score}</span>
      </div>

      <div className={`kid-count-stage ${solved ? "solved" : ""}`} aria-label={`${current.count} gambar`}>
        {Array.from({ length: current.count }, (_, index) => (
          <span
            key={index}
            className="kid-count-item"
            style={{ animationDelay: `${index * 0.06}s` }}
            aria-hidden
          >
            {current.emoji}
          </span>
        ))}
      </div>

      <div className="kid-number-options">
        {current.options.map(value => {
          const isWrong = wrong.includes(value)
          const tone = solved && value === current.count ? "right" : solved ? "dim" : isWrong ? "wrong" : ""
          return (
            <button
              key={value}
              className={`kid-number-tile ${tone}`}
              onClick={() => choose(value)}
              disabled={solved || isWrong}
              aria-label={`Angka ${value}`}
            >
              {value}
            </button>
          )
        })}
      </div>

      <div className="kid-feedback" aria-live="polite">
        {solved ? (
          <div className="kid-feedback-inner good">
            <span>
              Benar! <b>{current.count}</b> — {numberWord(current.count, lang)}
            </span>
            <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "Lihat hasil" : "Lanjut →"}
            </button>
          </div>
        ) : wrong.length ? (
          <div className="kid-feedback-inner soft">Hampir! Coba hitung sekali lagi 🤔</div>
        ) : (
          <div className="kid-feedback-inner soft">Ketuk angka yang benar.</div>
        )}
      </div>
    </div>
  )
}
