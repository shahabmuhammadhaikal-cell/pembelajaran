import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_PLAY_ITEMS } from "../../lib/kidsData.js"
import { kidSaySpeech, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS = 8

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Tebak Kata: lihat gambar, pilih tulisan yang benar. */
export default function GuessGame({ settings, onBack, onStar, onWin }) {
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

  const rounds = useMemo(() => {
    const targets = shuffle(KID_PLAY_ITEMS).slice(0, ROUNDS)
    return targets.map(target => {
      const others = shuffle(
        KID_PLAY_ITEMS.filter(entry => entry[lang] !== target[lang] && entry.emoji !== target.emoji)
      ).slice(0, 3)
      return { target, options: shuffle([target, ...others]) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, lang])

  const current = rounds[round]

  const choose = useCallback(
    option => {
      if (done || solved || !current) return
      if (option.key === current.target.key && option.emoji === current.target.emoji) {
        setSolved(true)
        playSfx("correct")
        if (!wrong.length) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) kidSaySpeech({ text: current.target[lang], lang, latin: current.target.tr }, { slow })
      } else {
        playSfx("wrong")
        setWrong(previous => (previous.includes(option.key + option.emoji) ? previous : [...previous, option.key + option.emoji]))
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
      gameId: "guess",
      score,
      stars: 2,
      stickerId: score >= 6 ? "game-guess" : null,
      title: score >= 6 ? "Detektif kata! 🔍" : "Permainan selesai!",
      subtitle: `Kamu memilih ${score} kata dengan benar dari ${rounds.length}.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🔍 Tebak Kata</div>
          <span className="kid-counter">{score}/{ROUNDS}</span>
        </div>
        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= 6 ? "🏅" : "🌟"}
          </div>
          <h3>{score >= 6 ? "Kamu jago membaca!" : "Kerja bagus!"}</h3>
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
        <div className="kid-subtitle">🔍 Tebak Kata</div>
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
          <strong>Ini apa ya?</strong>
          <span>Pilih tulisan yang cocok dengan gambarnya.</span>
        </div>
        <span className="kid-score-pill">⭐ {score}</span>
      </div>

      <div className="kid-guess-options">
        {current.options.map(option => {
          const id = option.key + option.emoji
          const isTarget = id === current.target.key + current.target.emoji
          const isWrong = wrong.includes(id)
          const tone = solved && isTarget ? "right" : solved ? "dim" : isWrong ? "wrong" : ""
          return (
            <button
              key={id}
              className={`kid-guess-option ${tone} ${lang === "ar" ? "kid-word-ar" : ""}`}
              onClick={() => choose(option)}
              disabled={solved || isWrong}
            >
              {option[lang]}
              {solved && isTarget ? <span className="kid-tile-check" aria-hidden>✓</span> : null}
            </button>
          )
        })}
      </div>

      <div className="kid-feedback" aria-live="polite">
        {solved ? (
          <div className="kid-feedback-inner good">
            <span>
              Benar! <b>{current.target.emoji}</b> {current.target[lang]}
            </span>
            <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "Lihat hasil" : "Lanjut →"}
            </button>
          </div>
        ) : wrong.length ? (
          <div className="kid-feedback-inner soft">Belum tepat, coba pilihan lain ya 🙂</div>
        ) : (
          <div className="kid-feedback-inner soft">Ketuk tulisan yang benar.</div>
        )}
      </div>
    </div>
  )
}
