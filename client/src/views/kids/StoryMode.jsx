import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"

function shuffle(list) {
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Cerita bergambar: baca kalimat bertutur lalu jawab kuis pemahaman. */
export default function StoryMode({ story, settings, onBack, onFinish }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const sentences = story.sentences
  const total = sentences.length

  const [phase, setPhase] = useState("read")
  const [index, setIndex] = useState(0)
  const [auto, setAuto] = useState(false)
  const [quiz, setQuiz] = useState({ index: 0, solved: false, wrong: [], correct: 0 })
  const finishedRef = useRef(false)

  const questions = useMemo(
    () =>
      story.questions.map(question => ({
        q: question.q,
        correct: question.options[question.answer],
        options: shuffle(question.options)
      })),
    [story]
  )

  const sentenceText = sentences[index][lang] || sentences[index].id
  const secondary = ["id", "en", "ar"].filter(key => key !== lang)

  useEffect(() => {
    setIndex(0)
    setPhase("read")
    setAuto(false)
    setQuiz({ index: 0, solved: false, wrong: [], correct: 0 })
    finishedRef.current = false
  }, [story.id])

  // Suara otomatis setiap kalimat berganti.
  useEffect(() => {
    if (!sound || phase !== "read") return undefined
    const timer = setTimeout(() => kidSay(sentenceText, lang, { slow }), 320)
    return () => clearTimeout(timer)
  }, [sentenceText, lang, sound, slow, phase])

  // Putar otomatis kalimat berikutnya.
  useEffect(() => {
    if (!auto || phase !== "read") return undefined
    const timer = setTimeout(() => {
      if (index + 1 >= total) {
        setAuto(false)
        return
      }
      setIndex(previous => Math.min(total - 1, previous + 1))
    }, 2800 + sentenceText.length * 45)
    return () => clearTimeout(timer)
  }, [auto, phase, index, total, sentenceText])

  const go = useCallback(
    delta => {
      playSfx("tap")
      setAuto(false)
      setIndex(previous => Math.max(0, Math.min(total - 1, previous + delta)))
    },
    [total]
  )

  const goQuiz = useCallback(() => {
    playSfx("pop")
    setAuto(false)
    setPhase("quiz")
    setQuiz({ index: 0, solved: false, wrong: [], correct: 0 })
  }, [])

  const choose = useCallback(
    option => {
      if (quiz.solved) return
      const current = questions[quiz.index]
      if (!current) return
      if (option === current.correct) {
        playSfx("correct")
        setQuiz(previous => ({ ...previous, solved: true, correct: previous.correct + 1 }))
        if (sound) kidSay("Hebat!", "id", { slow })
      } else {
        playSfx("wrong")
        setQuiz(previous => ({
          ...previous,
          wrong: previous.wrong.includes(option) ? previous.wrong : [...previous.wrong, option]
        }))
      }
    },
    [quiz.solved, quiz.index, questions, sound, slow]
  )

  const nextQuestion = useCallback(() => {
    playSfx("tap")
    if (quiz.index + 1 >= questions.length) {
      if (finishedRef.current) return
      finishedRef.current = true
      onFinish({
        correct: quiz.correct,
        total: questions.length,
        stickerId: `story-${story.id}`,
        stars: 4
      })
      return
    }
    setQuiz({ index: quiz.index + 1, solved: false, wrong: [], correct: quiz.correct })
  }, [quiz, questions.length, onFinish, story.id])

  if (phase === "quiz") {
    const current = questions[quiz.index]
    return (
      <div className="kid-game">
        <div className="kid-subhead">
          <button className="kid-back" onClick={onBack}>
            <span aria-hidden>🏠</span> Beranda
          </button>
          <div className="kid-subtitle">
            <span aria-hidden>{story.emoji}</span> Kuis cerita
          </div>
          <span className="kid-counter">
            {quiz.index + 1}/{questions.length}
          </span>
        </div>

        <div className="kid-quiz-card">
          <span className="kid-quiz-emoji" aria-hidden>
            {story.emoji}
          </span>
          <h3>{current.q}</h3>
          <div className="kid-quiz-options">
            {current.options.map(option => {
              const tone = quiz.solved && option === current.correct ? "right" : quiz.wrong.includes(option) ? "wrong" : quiz.solved ? "dim" : ""
              return (
                <button
                  key={option}
                  className={`kid-quiz-option ${tone}`}
                  onClick={() => choose(option)}
                  disabled={quiz.solved || quiz.wrong.includes(option)}
                >
                  {option}
                  {quiz.solved && option === current.correct ? (
                    <span className="kid-tile-check" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className="kid-feedback" aria-live="polite">
            {quiz.solved ? (
              <div className="kid-feedback-inner good">
                <span>Benar sekali! 🎉</span>
                <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={nextQuestion} autoFocus>
                  {quiz.index + 1 >= questions.length ? "Selesaikan" : "Pertanyaan berikutnya →"}
                </button>
              </div>
            ) : quiz.wrong.length ? (
              <div className="kid-feedback-inner soft">Belum tepat, ingat lagi ceritanya ya 🙂</div>
            ) : (
              <div className="kid-feedback-inner soft">Pilih satu jawaban.</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const isLast = index === total - 1

  return (
    <div className="kid-game kid-story">
      <div className="kid-subhead">
        <button className="kid-back" onClick={onBack}>
          <span aria-hidden>🏠</span> Beranda
        </button>
        <div className="kid-subtitle">
          <span aria-hidden>{story.emoji}</span> {story.title}
        </div>
        <span className="kid-counter">
          {index + 1}/{total}
        </span>
      </div>

      <div className="kid-scene" style={{ "--kid-accent": story.color }}>
        <span className="kid-scene-emoji" key={`${story.id}-${index}`} aria-hidden>
          {sentences[index].emoji}
        </span>
        <div className="kid-scene-cover" aria-hidden>
          {story.cover.map((emoji, position) => (
            <span key={position}>{emoji}</span>
          ))}
        </div>
      </div>

      <div className="kid-story-card">
        <p className={`kid-story-text ${lang === "ar" ? "kid-word-ar" : ""}`}>{sentenceText}</p>
        <p className="kid-story-sub">
          <span className={`kid-translation-tag kid-tag-${secondary[0]}`}>
            {secondary[0].toUpperCase()}
          </span>
          <span className={secondary[0] === "ar" ? "kid-word-ar" : ""}>{sentences[index][secondary[0]]}</span>
        </p>
        <div className="kid-story-controls">
          <button
            className="kid-btn kid-btn-ghost kid-btn-sm"
            onClick={() => {
              playSfx("pop")
              kidSay(sentenceText, lang, { slow })
            }}
          >
            🔊 Dengar
          </button>
          <button
            className={`kid-btn kid-btn-ghost kid-btn-sm ${auto ? "active" : ""}`}
            onClick={() => {
              playSfx("tap")
              setAuto(previous => !previous)
            }}
            aria-pressed={auto}
          >
            {auto ? "⏸️ Jeda" : "▶️ Putar otomatis"}
          </button>
        </div>
      </div>

      <div className="kid-story-dots" aria-hidden>
        {sentences.map((_, position) => (
          <span key={position} className={position <= index ? "on" : ""} />
        ))}
      </div>

      <div className="kid-nav">
        <button className="kid-btn kid-btn-ghost" onClick={() => go(-1)} disabled={index === 0}>
          <span aria-hidden>←</span> Sebelumnya
        </button>
        {isLast ? (
          <button className="kid-btn kid-btn-primary kid-btn-lg" onClick={goQuiz}>
            Kuis cerita 🎉
          </button>
        ) : (
          <button className="kid-btn kid-btn-primary" onClick={() => go(1)}>
            Berikutnya <span aria-hidden>→</span>
          </button>
        )}
      </div>

      <p className="kid-hint">Bacakan kalimatnya, lalu tirukan. Tekan 🔊 untuk mengulang suara.</p>
    </div>
  )
}
