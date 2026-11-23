import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_PLAY_ITEMS } from "../../lib/kidsData.js"
import { kidSay, kidSaySpeech, kidSpeech, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS = 10
const PRAISE = ["Hebat!", "Keren!", "Pintar!", "Luar biasa!", "Bagus sekali!"]

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Dengar & Pilih: dengar kata, tap gambar yang tepat. */
export default function ListenGame({ settings, onBack, onStar, onWin }) {
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
      const others = shuffle(KID_PLAY_ITEMS.filter(entry => entry.emoji !== target.emoji)).slice(0, 3)
      return { target, options: shuffle([target, ...others]) }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const current = rounds[round]

  useEffect(() => {
    if (!sound || done || !current) return undefined
    const timer = setTimeout(
      () => kidSaySpeech({ text: current.target[lang], lang, latin: current.target.tr }, { slow }),
      380
    )
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, seed, lang, sound, slow, done])

  const choose = useCallback(
    option => {
      if (done || solved || !current) return
      if (option.key === current.target.key) {
        setSolved(true)
        playSfx("correct")
        if (!wrong.length) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) {
          const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)]
          const word = kidSpeech({ text: current.target[lang], lang, latin: current.target.tr })
          kidSay(`${praise} ${word.text}`, word.code, { slow })
        }
      } else {
        playSfx("wrong")
        setWrong(previous => (previous.includes(option.key) ? previous : [...previous, option.key]))
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
      gameId: "listen",
      score,
      stars: 2,
      stickerId: score >= 8 ? "game-listen" : null,
      title: score >= 8 ? "Telinga emas! 🎧" : "Permainan selesai!",
      subtitle: `Kamu benar ${score} dari ${rounds.length} soal.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🎧 Dengar &amp; Pilih</div>
          <span className="kid-counter">{score}/10</span>
        </div>

        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= 8 ? "🏅" : "🌟"}
          </div>
          <h3>{score >= 8 ? "Telingamu hebat sekali!" : "Kerja bagus!"}</h3>
          <p>
            Kamu menjawab benar <b>{score}</b> dari <b>{rounds.length}</b> soal.
          </p>
          <div className="kid-result-stars" aria-label={`Mendapat ${score + 2} bintang`}>
            {Array.from({ length: Math.min(10, score) }, (_, index) => (
              <span key={index} aria-hidden>
                ⭐
              </span>
            ))}
            <span className="kid-result-bonus">+2 bonus</span>
          </div>
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
        <div className="kid-subtitle">🎧 Dengar &amp; Pilih</div>
        <span className="kid-counter">
          {round + 1}/{rounds.length}
        </span>
      </div>

      <div className="kid-bar kid-bar-game">
        <span style={{ width: `${((round + (solved ? 1 : 0)) / rounds.length) * 100}%` }} />
      </div>

      <div className="kid-prompt">
        <button
          className="kid-speaker"
          onClick={() => {
            playSfx("pop")
            kidSaySpeech({ text: current.target[lang], lang, latin: current.target.tr }, { slow })
          }}
          aria-label="Ulangi suara"
        >
          <span aria-hidden>🔊</span>
        </button>
        <div className="kid-prompt-text">
          <strong>Dengarkan, lalu pilih gambarnya!</strong>
          <span>Ketuk pengeras suara untuk mendengar lagi.</span>
        </div>
        <span className="kid-score-pill">⭐ {score}</span>
      </div>

      <div className="kid-tiles">
        {current.options.map(option => {
          const isTarget = option.key === current.target.key
          const isWrong = wrong.includes(option.key)
          const tone = solved && isTarget ? "right" : isWrong ? "wrong" : solved ? "dim" : ""
          return (
            <button
              key={`${option.key}-${option.emoji}`}
              className={`kid-tile ${tone}`}
              onClick={() => choose(option)}
              disabled={solved || isWrong}
              aria-label={solved ? option[lang] : "Pilih gambar ini"}
            >
              <span className="kid-tile-emoji" aria-hidden>
                {option.emoji}
              </span>
              {solved ? <span className="kid-tile-label">{option[lang]}</span> : null}
              {solved && isTarget ? <span className="kid-tile-check" aria-hidden>✓</span> : null}
            </button>
          )
        })}
      </div>

      <div className="kid-feedback" aria-live="polite">
        {solved ? (
          <div className="kid-feedback-inner good">
            <span>
              Benar! <b>{current.target[lang]}</b> {current.target.emoji}
            </span>
            <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={next} autoFocus>
              Lanjut →
            </button>
          </div>
        ) : wrong.length ? (
          <div className="kid-feedback-inner soft">Belum tepat, coba gambar yang lain ya 🙂</div>
        ) : (
          <div className="kid-feedback-inner soft">Pilih salah satu gambar di atas.</div>
        )}
      </div>
    </div>
  )
}
