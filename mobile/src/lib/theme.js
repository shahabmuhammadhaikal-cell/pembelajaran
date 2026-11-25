/** Palet dan gaya dasar aplikasi mobile, disamakan dengan Mode Anak versi web. */
export const colors = {
  ink: "#2b1c46",
  muted: "#6d5f8a",
  line: "rgba(43,28,70,0.12)",
  bg: "#f4f8ff",
  card: "#ffffff",
  pink: "#ff7aa2",
  orange: "#ffab3d",
  yellow: "#ffd43b",
  green: "#39c98c",
  blue: "#4f8cff",
  purple: "#a06bff",
  red: "#ef4444",
  softYellow: "#fff3d6",
  softGreen: "#e8fbf1",
  softBlue: "#e9f2ff"
}

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 }

export const shadow = {
  shadowColor: "#2b1c46",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 4
}

export const text = {
  h1: { fontSize: 24, fontWeight: "800", color: colors.ink },
  h2: { fontSize: 19, fontWeight: "800", color: colors.ink },
  h3: { fontSize: 16, fontWeight: "800", color: colors.ink },
  body: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  }
}
