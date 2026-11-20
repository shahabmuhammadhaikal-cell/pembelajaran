import { useEffect, useMemo } from "react"
import { STICKER_MAP } from "../../lib/kidsData.js"

const COLORS = ["#ff7aa2", "#ffab3d", "#ffd43b", "#39c98c", "#4f8cff", "#a06bff"]

/** Perayaan: konfeti + stiker/level baru. */
export default function Celebration({ data, onClose }) {
  const sticker = data && data.stickerId ? STICKER_MAP[data.stickerId] : null
  const heroEmoji = (data && data.emoji) || (sticker ? sticker.emoji : "🏆")

  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 1.8,
        color: COLORS[index % COLORS.length],
        size: 8 + Math.random() * 10,
        tilt: Math.round(Math.random() * 360)
      })),
    [data && data.stamp]
  )

  useEffect(() => {
    if (!data) return undefined
    const onKey = event => {
      if (event.key === "Escape" || event.key === "Enter") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [data, onClose])

  if (!data) return null

  return (
    <div className="kid-celebrate" role="dialog" aria-modal="true" aria-label="Selamat, kamu berhasil!">
      <div className="kid-celebrate-backdrop" onClick={onClose} />
      <div className="kid-confetti" aria-hidden>
        {pieces.map(piece => (
          <span
            key={piece.id}
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 0.6,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.tilt}deg)`
            }}
          />
        ))}
      </div>
      <div className="kid-celebrate-card">
        <div className="kid-celebrate-emoji" aria-hidden>
          {heroEmoji}
        </div>
        <h3>{data.title || "Hebat!"}</h3>
        <p>{data.subtitle}</p>
        {sticker ? (
          <div className="kid-sticker-gain">
            Stiker baru: <b>{sticker.name}</b>
          </div>
        ) : null}
        {data.stars ? <div className="kid-star-gain">+{data.stars} ⭐</div> : null}
        <button className="kid-btn kid-btn-primary kid-btn-lg" onClick={onClose} autoFocus>
          Lanjut 🎉
        </button>
      </div>
    </div>
  )
}
