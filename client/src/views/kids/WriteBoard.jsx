import { useCallback, useEffect, useRef, useState } from "react"
import { kidSay, playSfx } from "../../lib/kidsAudio.js"

/**
 * Papan tulis huruf hijaiyah: huruf contoh besar sebagai panduan, anak menebalkan
 * dengan jari atau mouse di kanvas. Kanvas mengikuti ukuran wadah dan rasio piksel.
 */
export default function WriteBoard({ letters, onBack }) {
  const [index, setIndex] = useState(0)
  const [hasInk, setHasInk] = useState(false)
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const item = letters[index % letters.length]

  const resetCanvas = useCallback((clearInk = true) => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    const width = wrap.clientWidth || 320
    const height = wrap.clientHeight || 320
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineWidth = 15
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#2b1c46"
    if (clearInk) setHasInk(false)
  }, [])

  useEffect(() => {
    resetCanvas()
    const onResize = () => resetCanvas()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [resetCanvas, index])

  const point = event => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const start = event => {
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext("2d")
    const position = point(event)
    if (!canvas || !ctx || !position) return
    event.preventDefault()
    canvas.setPointerCapture?.(event.pointerId)
    drawing.current = true
    last.current = position
    ctx.beginPath()
    ctx.arc(position.x, position.y, 7, 0, Math.PI * 2)
    ctx.fillStyle = "#2b1c46"
    ctx.fill()
    setHasInk(true)
  }

  const move = event => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext("2d")
    const position = point(event)
    if (!ctx || !position) return
    event.preventDefault()
    const from = last.current || position
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(position.x, position.y)
    ctx.stroke()
    last.current = position
  }

  const end = event => {
    drawing.current = false
    last.current = null
    canvasRef.current?.releasePointerCapture?.(event.pointerId)
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas && canvas.getContext("2d")
    if (!canvas || !ctx) return
    playSfx("tap")
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
  }, [])

  const shift = useCallback(
    delta => {
      playSfx("tap")
      setIndex(previous => (previous + delta + letters.length) % letters.length)
    },
    [letters.length]
  )

  return (
    <div className="kid-game kid-write">
      <div className="kid-subhead">
        <button className="kid-back" onClick={onBack}>
          <span aria-hidden>🏠</span> Beranda
        </button>
        <div className="kid-subtitle">✍️ Menulis Huruf Arab</div>
        <span className="kid-counter">
          {index + 1}/{letters.length}
        </span>
      </div>

      <div className="kid-bar kid-bar-game">
        <span style={{ width: `${((index + 1) / letters.length) * 100}%` }} />
      </div>

      <div className="kid-write-head">
        <div className="kid-write-letter-info">
          <strong>{item.en}</strong>
          <span>
            Contoh: <b className="kid-word-ar">{item.sample}</b> · {item.sampleId} ({item.sampleTr})
          </span>
        </div>
        <button
          className="kid-btn kid-btn-ghost kid-btn-sm"
          onClick={() => {
            playSfx("pop")
            kidSay(item.en, "id")
          }}
        >
          🔊 Dengar nama huruf
        </button>
      </div>

      <div className="kid-write-board" ref={wrapRef}>
        <span className={`kid-write-guide ${item.big === "ه" ? "wide" : ""}`} aria-hidden>
          {item.big}
        </span>
        <canvas
          ref={canvasRef}
          className="kid-write-canvas"
          aria-label={`Kanvas menulis huruf ${item.en}`}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>

      <div className="kid-write-actions">
        <button className="kid-btn kid-btn-ghost kid-btn-sm" onClick={clear} disabled={!hasInk}>
          🧽 Hapus
        </button>
        <button className="kid-btn kid-btn-ghost kid-btn-sm" onClick={() => shift(-1)}>
          ← Sebelumnya
        </button>
        <button className="kid-btn kid-btn-primary kid-btn-sm" onClick={() => shift(1)}>
          Berikutnya →
        </button>
      </div>

      <div className="kid-write-picker" role="group" aria-label="Pilih huruf hijaiyah">
        {letters.map((letter, position) => (
          <button
            key={letter.key}
            className={`kid-write-chip ${position === index ? "on" : ""} ${letter.big === "ه" ? "wide" : ""}`}
            onClick={() => {
              playSfx("tap")
              setIndex(position)
            }}
            aria-pressed={position === index}
            title={letter.en}
          >
            {letter.big}
          </button>
        ))}
      </div>

      <p className="kid-hint">
        Tebalkan huruf contoh dengan jari atau mouse. Kanvas bisa dihapus kapan saja untuk mencoba lagi.
      </p>
    </div>
  )
}
