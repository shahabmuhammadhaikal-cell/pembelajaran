import { useCallback, useEffect, useState } from "react"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"
import ShapeGlyph, { shapeColor } from "../../components/kids/ShapeGlyph.jsx"

const LANG_LABEL = { en: "Inggris", ar: "Arab", id: "Indonesia" }

function Art({ item, topic, index }) {
  if (item.hex) {
    return <span className="kid-swatch" style={{ background: item.hex }} aria-hidden />
  }
  if (item.shape) {
    return <ShapeGlyph shape={item.shape} color={shapeColor(index)} size={116} />
  }
  if (item.numeral) {
    return (
      <span className="kid-numeral" aria-hidden>
        {item.numeral}
      </span>
    )
  }
  if (item.big) {
    return (
      <span className="kid-letter-wrap">
        <span className={`kid-letter ${topic.id === "hijaiyah" ? "kid-letter-ar" : ""}`}>{item.big}</span>
        <span className="kid-letter-emoji" aria-hidden>
          {item.emoji}
        </span>
      </span>
    )
  }
  return (
    <span className="kid-art-emoji" aria-hidden>
      {item.emoji}
    </span>
  )
}

/** Belajar: kartu besar bergambar dengan suara otomatis. */
export default function LearnMode({ topic, settings, onBack, onSeen, onDone }) {
  const [index, setIndex] = useState(0)
  const total = topic.items.length
  const item = topic.items[Math.min(index, total - 1)]
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const label = item[lang] || item.en || item.id || ""

  useEffect(() => {
    setIndex(0)
  }, [topic.id])

  useEffect(() => {
    onSeen(item.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.key])

  const say = useCallback(
    (text, code) => {
      if (!sound) return
      playSfx("pop")
      kidSay(text, code, { slow })
    },
    [sound, slow]
  )

  // Suara otomatis setiap kartu berganti.
  useEffect(() => {
    if (!sound) return undefined
    const timer = setTimeout(() => kidSay(label, lang, { slow }), 300)
    return () => clearTimeout(timer)
  }, [item.key, label, lang, sound, slow])

  const next = useCallback(() => {
    playSfx("tap")
    setIndex(previous => Math.min(total - 1, previous + 1))
  }, [total])

  const prev = useCallback(() => {
    playSfx("tap")
    setIndex(previous => Math.max(0, previous - 1))
  }, [])

  useEffect(() => {
    const onKey = event => {
      const tag = (event.target && event.target.tagName ? event.target.tagName : "").toLowerCase()
      if (["input", "textarea", "select"].includes(tag)) return
      if (event.key === "ArrowRight") {
        next()
        event.preventDefault()
      } else if (event.key === "ArrowLeft") {
        prev()
        event.preventDefault()
      } else if (event.key === " ") {
        say(label, lang)
        event.preventDefault()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, say, label, lang])

  const others = ["id", "en", "ar"].filter(key => key !== lang)
  const isLast = index === total - 1
  const progress = Math.round(((index + 1) / total) * 100)

  return (
    <div className="kid-learn">
      <div className="kid-subhead">
        <button className="kid-back" onClick={onBack}>
          <span aria-hidden>🏠</span> Beranda
        </button>
        <div className="kid-subtitle">
          <span aria-hidden>{topic.emoji}</span> {topic.label}
        </div>
        <span className="kid-counter">
          {index + 1}/{total}
        </span>
      </div>

      <div className="kid-card" style={{ "--kid-accent": topic.color }}>
        <div className="kid-card-top">
          <span className="kid-card-badge">Kata {topic.label}</span>
          <span className="kid-card-count">
            {index + 1} dari {total}
          </span>
        </div>

        <div className="kid-card-art">
          <Art item={item} topic={topic} index={index} />
        </div>

        <div className={`kid-card-word ${lang === "ar" ? "kid-word-ar" : ""}`}>{label}</div>
        {lang !== "ar" && item.tr ? <div className="kid-card-tr">{item.tr}</div> : null}

        {item.sample ? (
          <div className="kid-card-sample">
            Contoh: <b className={lang === "ar" ? "" : "arabic"}>{item.sample}</b>
            {item.sampleId ? <span className="kid-card-sample-id"> · {item.sampleId}</span> : null}
          </div>
        ) : null}

        <div className="kid-say-row">
          <button className="kid-say-btn" onClick={() => say(label, lang)} aria-label={`Dengarkan ${label}`}>
            <span aria-hidden>🔊</span> Dengar
          </button>
          <button
            className="kid-say-btn kid-say-btn-ghost"
            onClick={() => {
              playSfx("pop")
              kidSay(label, lang, { slow: true })
            }}
            aria-label={`Dengarkan ${label} dengan pelan`}
          >
            <span aria-hidden>🐢</span> Pelan
          </button>
        </div>

        <div className="kid-translations">
          {others.map(key => (
            <button
              key={key}
              className="kid-translation"
              onClick={() => say(item[key] || "", key)}
              aria-label={`Dengarkan ${LANG_LABEL[key]}`}
            >
              <span className={`kid-translation-tag kid-tag-${key}`}>{key.toUpperCase()}</span>
              <span className={`kid-translation-value ${key === "ar" ? "kid-word-ar" : ""}`}>
                {item[key] || "-"}
              </span>
              <span className="kid-translation-speaker" aria-hidden>
                🔊
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="kid-learn-bar">
        <div className="kid-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="kid-nav">
        <button className="kid-btn kid-btn-ghost" onClick={prev} disabled={index === 0}>
          <span aria-hidden>←</span> Sebelumnya
        </button>
        {isLast ? (
          <button className="kid-btn kid-btn-primary kid-btn-lg" onClick={() => { playSfx("star"); onDone() }}>
            Selesai 🎉
          </button>
        ) : (
          <button className="kid-btn kid-btn-primary" onClick={next}>
            Berikutnya <span aria-hidden>→</span>
          </button>
        )}
      </div>

      <p className="kid-hint">
        Tip: tekan <kbd>←</kbd> <kbd>→</kbd> untuk pindah kartu dan <kbd>spasi</kbd> untuk mendengar lagi.
      </p>
    </div>
  )
}
