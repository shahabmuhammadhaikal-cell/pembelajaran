import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KID_SPELL_ITEMS } from "../../lib/kidsData.js"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"

const ROUNDS = 5

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Susun Kata: susun huruf menjadi kata Inggris dari gambar + arti. */
export default function SpellGame({ settings, onBack, onStar, onWin }) {
  const sound = settings.sound !== false
  const slow = settings.slow === true
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
    for (const entry of shuffle(KID_SPELL_ITEMS)) {
      const answer = String(entry.en || "").toUpperCase().replace(/[^A-Z]/g, "")
      if (answer.length < 3 || seen.has(answer)) continue
      seen.add(answer)
      result.push({
        item: entry,
        answer,
        letters: shuffle(answer.split("").map((char, index) => ({ char, id: `${seed}-${index}` })))
      })
      if (result.length >= ROUNDS) break
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const current = rounds[round]

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const addLetter = useCallback(
    entry => {
      if (solved || !current) return
      if (picked.some(item => item.id === entry.id)) return
      playSfx("tap")
      const next = [...picked, entry]
      setPicked(next)
      const word = next.map(item => item.char).join("")
      if (word === current.answer) {
        setSolved(true)
        playSfx("correct")
        if (!tried) {
          setScore(previous => previous + 1)
          onStar()
        }
        if (sound) kidSay(current.item.en, "en", { slow })
        return
      }
      if (next.length === current.answer.length) {
        playSfx("wrong")
        setTried(true)
        setWrongShake(true)
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => {
          setPicked([])
          setWrongShake(false)
          resetTimer.current = null
        }, 800)
      }
    },
    [solved, current, picked, tried, onStar, sound, slow]
  )

  const removeAt = useCallback(
    index => {
      if (solved) return
      playSfx("tap")
      setPicked(previous => previous.filter((_, position) => position !== index))
    },
    [solved]
  )

  const clearLetters = useCallback(() => {
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
    onWin({
      gameId: "spell",
      score,
      stars: 2,
      stickerId: score >= 4 ? "game-spell" : null,
      title: score >= 4 ? "Jago menyusun kata! ✏️" : "Latihan menyusun selesai!",
      subtitle: `Kamu menyusun ${score} dari ${rounds.length} kata dengan benar.`
    })
  }, [done, score, rounds.length, onWin])

  if (done) {
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">✏️ Susun Kata</div>
          <span className="kid-counter">{score}/{ROUNDS}</span>
        </div>
        <div className="kid-result">
          <div className="kid-result-emoji" aria-hidden>
            {score >= 4 ? "🏅" : "🌟"}
          </div>
          <h3>{score >= 4 ? "Ejaanmu makin hebat!" : "Kerja bagus!"}</h3>
          <p>
            Kata tersusun benar <b>{score}</b> dari <b>{rounds.length}</b>.
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
        <div className="kid-subtitle">✏️ Susun Kata</div>
        <span className="kid-counter">
          {round + 1}/{rounds.length}
        </span>
      </div>

      <div className="kid-spell-card">
        <div className="kid-spell-head">
          <span className="kid-spell-emoji" aria-hidden>
            {current.item.emoji}
          </span>
          <div className="kid-spell-copy">
            <strong>Susun kata Inggrisnya!</strong>
            <span>
              Artinya: <b>{current.item.id}</b>
            </span>
          </div>
          <span className="kid-score-pill">⭐ {score}</span>
        </div>

        <div className={`kid-slots ${wrongShake ? "shake" : ""} ${solved ? "solved" : ""}`}>
          {current.answer.split("").map((_, index) => {
            const filled = picked[index]
            return (
              <button
                key={`slot-${index}`}
                className={`kid-slot ${filled ? "filled" : ""}`}
                onClick={() => removeAt(index)}
                disabled={!filled || solved}
                aria-label={filled ? `Hapus huruf ${filled.char}` : "Kotak huruf kosong"}
              >
                {filled ? filled.char : ""}
              </button>
            )
          })}
        </div>

        <div className="kid-letters">
          {current.letters.map(entry => {
            const used = picked.some(item => item.id === entry.id)
            return (
              <button
                key={entry.id}
                className={`kid-letter-tile ${used ? "used" : ""}`}
                onClick={() => addLetter(entry)}
                disabled={used || solved}
                aria-label={`Huruf ${entry.char}`}
              >
                {entry.char}
              </button>
            )
          })}
        </div>

        <div className="kid-spell-tools">
          {solved ? (
            <button className="kid-btn kid-btn-primary" onClick={next} autoFocus>
              {round + 1 >= rounds.length ? "Lihat hasil" : "Kata berikutnya →"}
            </button>
          ) : (
            <>
              <button
                className="kid-btn kid-btn-ghost kid-btn-sm"
                onClick={() => {
                  playSfx("pop")
                  kidSay(current.item.en, "en", { slow })
                }}
              >
                🔊 Dengar kata
              </button>
              <button
                className="kid-btn kid-btn-ghost kid-btn-sm"
                onClick={clearLetters}
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
          <div className="kid-feedback-inner soft">Belum tepat, hurufnya diacak lagi ya 🙂</div>
        ) : (
          <div className="kid-feedback-inner soft">Ketuk huruf untuk menyusun kata.</div>
        )}
      </div>
    </div>
  )
}
