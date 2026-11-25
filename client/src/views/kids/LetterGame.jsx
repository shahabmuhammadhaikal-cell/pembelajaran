import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_PLAY_ITEMS } from "../../lib/kidsData.js"
import { kidSaySpeech, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS_BY_LENGTH = { short: 5, normal: 8, long: 12 }
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Huruf Awal: lihat gambar + arti Indonesia, pilih huruf pertama kata Inggrisnya.
 * Gambar yang dipakai selalu berbeda huruf awalnya supaya tidak ada dua jawaban benar.
 */
export default function LetterGame({ settings, onBack, onStar, onWin }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const roundsCount = ROUNDS_BY_LENGTH[settings.length] || ROUNDS_BY_LENGTH.normal
  const [seed, setSeed] = useState(0)
  const [round, setRound] = useState(0)
  const [wrong, setWrong] = useState([])
  const [solved, setSolved] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const wonRef = useRef(false)

  const rounds = useMemo(() => {
    const pool = KID_PLAY_ITEMS.filter(entry => /^[A-Za-z]/.test(String(entry.en || "")))
    const usedLetters = new Set()
    const picked = []
    for (const entry of shuffle(pool)) {
      const letter = String(entry.en).charAt(0).toUpperCase()
      if (usedLetters.has(letter)) continue
      usedLetters.add(letter)
      const distractors = shuffle(LETTERS.filter(value => value !== letter)).slice(0, 3)
      picked.push({ target: entry, letter, options: shuffle([letter, ...distractors]) })
      if (picked.length >= roundsCount) break
    }
    return picked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, roundsCount])

  const current = rounds[round]

  const choose = useCallback(
    option => {
      if (done || solved || !current) return
      if (option === current.letter) {
        setSolved(true)
        playSfx("correct")
        if (!wrong.length) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) {
          const speech = { text: current.target.en, lang: "en" }
          kidSaySpeech(speech, { slow })
        }
      } else {
        playSfx("wrong")
        setWrong(previous => (previous.includes(option) ? previous : [...previous, option]))
      }
    },
    [done, solved, current, wrong.length, onStar, sound, slow]
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
      gameId: "letter",
      score,
      stars: 2,
      stickerId: score >= 6 ? "game-letter" : null,
      title: score >= 6 ? "Jago huruf pertama! 🅰️" : "Permainan selesai!",
      subtitle: `Kamu menebak ${score} huruf pertama dengan benar dari ${rounds.length}.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🅰️ Huruf Awal</div>
          <span className="kid-counter">
            {score}/{roundsCount}
          </span>
        </div>
        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= 6 ? "🏅" : "🌟"}
          </div>
          <h3>{score >= 6 ? "Kamu hafal hurufnya!" : "Kerja bagus!"}</h3>
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

  if (!current) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🅰️ Huruf Awal</div>
        </div>
        <div className="kid-result">
          <h3>Belum ada kata untuk dimainkan.</h3>
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
        <div className="kid-subtitle">🅰️ Huruf Awal</div>
        <span className="kid-counter">
          {round + 1}/{rounds.length}
        </span>
      </div>

      <div className="kid-bar kid-bar-game">
        <span style={{ width: `${((round + (solved ? 1 : 0)) / rounds.length) * 100}%` }} />
      </div>

      <div className="kid-guess-stage">
        <div className="kid-guess-art" aria-hidden>
          {current.target.emoji}
        </div>
        <div className="kid-guess-question">
          <strong>Huruf pertamanya apa?</strong>
          <span>
            {current.target.id} · kata Inggrisnya {solved ? <b>{current.target.en}</b> : "diawali huruf…"}
          </span>
        </div>
        <span className="kid-score-pill">⭐ {score}</span>
      </div>

      <div className="kid-letter-options">
        {current.options.map(option => {
          const isTarget = option === current.letter
          const isWrong = wrong.includes(option)
          const tone = solved && isTarget ? "right" : solved ? "dim" : isWrong ? "wrong" : ""
          return (
            <button
              key={option}
              className={`kid-letter-option ${tone}`}
              onClick={() => choose(option)}
              disabled={solved || isWrong}
              aria-label={`Huruf ${option}`}
            >
              {option}
              {solved && isTarget ? (
                <span className="kid-tile-check" aria-hidden>
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="kid-feedback" aria-live="polite">
        {solved ? (
          <div className="kid-feedback-inner good">
            <span>
              Benar! <b>{current.target.emoji}</b> {current.target.en} ({current.target[lang]})
            </span>
            <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "Lihat hasil" : "Lanjut →"}
            </button>
          </div>
        ) : wrong.length ? (
          <div className="kid-feedback-inner soft">Belum tepat, coba huruf lain ya 🙂</div>
        ) : (
          <div className="kid-feedback-inner soft">Ketuk huruf pertama kata Inggrisnya.</div>
        )}
      </div>
    </div>
  )
}
