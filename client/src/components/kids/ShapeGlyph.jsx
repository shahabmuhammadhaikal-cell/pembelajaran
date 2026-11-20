/** Bentuk geometris untuk topik "Bentuk" (tanpa gambar/aset). */

const PALETTES = ["#ff7aa2", "#4f8cff", "#39c98c", "#ffb020", "#a06bff", "#22b8a6"]

export function shapeColor(index = 0) {
  return PALETTES[Math.abs(index) % PALETTES.length]
}

export default function ShapeGlyph({ shape, color = "#ffd43b", size = 108 }) {
  if (shape === "heart") {
    return (
      <span className="kid-shape-emoji" style={{ fontSize: size * 0.92 }} aria-hidden>
        ❤️
      </span>
    )
  }
  if (shape === "crescent") {
    return (
      <span className="kid-shape-emoji" style={{ fontSize: size * 0.92 }} aria-hidden>
        🌙
      </span>
    )
  }

  const base = {
    width: size,
    height: size,
    background: `linear-gradient(150deg, ${color}, ${color}dd)`,
    boxShadow: `0 12px 0 ${color}55`
  }

  if (shape === "circle") return <span className="kid-shape" style={{ ...base, borderRadius: "50%" }} aria-hidden />
  if (shape === "square") return <span className="kid-shape" style={{ ...base, borderRadius: size * 0.16 }} aria-hidden />
  if (shape === "triangle")
    return (
      <span
        className="kid-shape"
        style={{ ...base, clipPath: "polygon(50% 4%, 98% 94%, 2% 94%)", boxShadow: "none" }}
        aria-hidden
      />
    )
  if (shape === "rectangle")
    return (
      <span
        className="kid-shape"
        style={{ ...base, width: size * 1.35, height: size * 0.78, borderRadius: size * 0.14 }}
        aria-hidden
      />
    )
  if (shape === "diamond")
    return <span className="kid-shape" style={{ ...base, borderRadius: size * 0.16, transform: "rotate(45deg)", width: size * 0.78, height: size * 0.78 }} aria-hidden />
  if (shape === "star")
    return (
      <span
        className="kid-shape"
        style={{
          ...base,
          clipPath:
            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          boxShadow: "none"
        }}
        aria-hidden
      />
    )

  return (
    <span className="kid-shape" style={{ ...base, borderRadius: size * 0.16 }} aria-hidden />
  )
}
