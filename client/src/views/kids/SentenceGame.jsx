import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_SENTENCES } from "../../lib/kidsSentences.js"
import { kidSay, kidSaySpeech, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS_BY_LENGTH = { short: 3, normal: 5, long: 8 }

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Susun Kalimat: susun kata-kata menjadi kalimat Inggris dari frasa sederhana. */
export default function SentenceGame({ settings, onBack, onStar, onWin, onMistake }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const roundsCount = ROUNDS_BY_LENGTH[settings.length] || ROUNDS_BY_LENGTH.normal
  const [seed, setSeed] = useState(0)
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState([])
  const [wrongShake, setWrongShake] = useState(false)
  const [solved, setSolved] = useState(false)
  const [tried, setTried] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const wonRef = useRef(false)
  const resetTimer = useRef(null)

  const rounds = useMemo(() => {
    const result = []
    const seen = new Set()
    for (const entry of shuffle(KID_SENTENCES)) {
      if (seen.has(entry.key)) continue
      seen.add(entry.key)
      const words = String(entry.en || "")
        .split(/\s+/)
        .filter(Boolean)
      result.push({
        item: entry,
        answer: words.join(" "),
        tokens: shuffle(words.map((word, index) => ({ word, id: `${seed}-${entry.key}-${index}` })))
      })
      if (result.length >= roundsCount) break
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, roundsCount])

  const current = rounds[round]

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const pickWord = useCallback(
    token => {
      if (solved || !current) return
      if (picked.some(item => item.id === token.id)) return
      playSfx("tap")
      const next = [...picked, token]
      setPicked(next)
      const sentence = next.map(item => item.word).join(" ")
      if (sentence === current.answer) {
        setSolved(true)
        playSfx("correct")
        if (!tried) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) kidSay(current.item.en, "en", { slow })
        return
      }
      if (next.length === current.tokens.length) {
        playSfx("wrong")
        if (!tried) onMistake?.("sentence", current.item.key)
        setTried(true)
        setWrongShake(true)
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => {
          setPicked([])
          setWrongShake(false)
          resetTimer.current = null
        }, 850)
      }
    },
    [solved, current, picked, tried, onStar, sound, slow, onMistake]
  )

  const removeAt = useCallback(
    index => {
      if (solved) return
      playSfx("tap")
      setPicked(previous => previous.filter((_, position) => position !== index))
    },
    [solved]
  )

  const clearAll = useCallback(() => {
    if (solved) return
    playSfx("pop")
    setPicked([])
  }, [solved])

  const next = useCallback(() => {
    if (!solved) return
    playSfx("tap")
    if (round + 1 >= rounds.length) {
      setDone(true)
      return
    }
    setRound(previous => previous + 1)
    setPicked([])
    setTried(false)
    setSolved(false)
    setWrongShake(false)
  }, [solved, round, rounds.length])

  const restart = useCallback(() => {
    wonRef.current = false
    playSfx("tap")
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setSeed(previous => previous + 1)
    setRound(0)
    setPicked([])
    setTried(false)
    setSolved(false)
    setWrongShake(false)
    setScore(0)
    setDone(false)
  }, [])

  useEffect(() => {
    if (!done || wonRef.current) return
    wonRef.current = true
    const good = score >= Math.ceil(rounds.length * 0.8)
    onWin({
      gameId: "sentence",
      score,
      stars: 2,
      stickerId: good ? "game-sentence" : null,
      title: good ? "Perangkai kalimat! 🧱" : "Latihan menyusun selesai!",
      subtitle: `Kamu menyusun ${score} dari ${rounds.length} kalimat dengan benar.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">🧱 Susun Kalimat</div>
          <span className="kid-counter">
            {score}/{roundsCount}
          </span>
        </div>
        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= Math.ceil(rounds.length * 0.8) ? "🏅" : "🌟"}
          </div>
          <h3>{score >= Math.ceil(rounds.length * 0.8) ? "Kalimatmu rapi sekali!" : "Kerja bagus!"}</h3>
          <p>
            Kalimat tersusun benar <b>{score}</b> dari <b>{rounds.length}</b>.
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
          <div className="kid-subtitle">🧱 Susun Kalimat</div>
        </div>
        <div className="kid-result">
          <h3>Belum ada kalimat untuk dimainkan.</h3>
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
        <div className="kid-subtitle">🧱 Susun Kalimat</div>
        <span className="kid-counter">
          {round + 1}/{rounds.length}
        </span>
      </div>

      <div className="kid-bar kid-bar-game">
        <span style={{ width: `${((round + (solved ? 1 : 0)) / rounds.length) * 100}%` }} />
      </div>

      <div className="kid-spell-card kid-sentence-card">
        <div className="kid-spell-head">
          <span className="kid-spell-emoji" aria-hidden>
            {current.item.emoji}
          </span>
          <div className="kid-spell-copy">
            <strong>Susun kalimat Inggrisnya!</strong>
            <span>
              Artinya: <b>{current.item.id}</b>
            </span>
            <span className="kid-sentence-ar kid-word-ar">{current.item.ar}</span>
          </div>
          <span className="kid-score-pill">⭐ {score}</span>
        </div>

        <div
          className={`kid-sentence-slots ${wrongShake ? "shake" : ""} ${solved ? "solved" : ""}`}
        >
          {current.tokens.map((_, index) => {
            const filled = picked[index]
            return (
              <button
                key={`slot-${index}`}
                className={`kid-sentence-slot ${filled ? "filled" : ""}`}
                onClick={() => removeAt(index)}
                disabled={!filled || solved}
                aria-label={filled ? `Hapus kata ${filled.word}` : "Tempat kata kosong"}
              >
                {filled ? filled.word : ""}
              </button>
            )
          })}
        </div>

        <div className="kid-sentence-tiles">
          {current.tokens.map(token => {
            const used = picked.some(item => item.id === token.id)
            return (
              <button
                key={token.id}
                className={`kid-sentence-tile ${used ? "used" : ""}`}
                onClick={() => pickWord(token)}
                disabled={used || solved}
                aria-label={`Kata ${token.word}`}
              >
                {token.word}
              </button>
            )
          })}
        </div>

        <div className="kid-spell-tools">
          {solved ? (
            <button className="kid-btn kid-btn-primary" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "Lihat hasil" : "Kalimat berikutnya →"}
            </button>
          ) : (
            <>
              <button
                className="kid-btn kid-btn-ghost kid-btn-sm"
                onClick={() => {
                  playSfx("pop")
                  kidSaySpeech(
                    { text: current.item[lang] || current.item.id, lang, latin: current.item.tr },
                    { slow }
                  )
                }}
              >
                🔊 Dengar petunjuk
              </button>
              <button
                className="kid-btn kid-btn-ghost kid-btn-sm"
                onClick={() => {
                  playSfx("pop")
                  kidSay(current.item.en, "en", { slow })
                }}
              >
                🔊 Dengar kalimat
              </button>
              <button
                className="kid-btn kid-btn-ghost kid-btn-sm"
                onClick={clearAll}
                disabled={!picked.length}
              >
                🧽 Hapus semua
              </button>
            </>
          )}
        </div>
      </div>

      <div className="kid-feedback" aria-live="polite">
        {solved ? (
          <div className="kid-feedback-inner good">
            <span>
              Tepat! <b>{current.item.en}</b> = {current.item.id} {current.item.emoji}
            </span>
          </div>
        ) : wrongShake ? (
          <div className="kid-feedback-inner soft">Belum tepat, kata-katanya diacak lagi ya 🙂</div>
        ) : (
          <div className="kid-feedback-inner soft">Ketuk kata sesuai urutan kalimat yang benar.</div>
        )}
      </div>
    </div>
  )
}
