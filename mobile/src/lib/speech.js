import * as Speech from "expo-speech"

const LANGUAGE = { id: "id-ID", en: "en-US", ar: "ar-SA" }

/** Apakah teks Arab perlu dibacakan lewat transliterasi (perangkat tanpa suara Arab)? */
const ARABIC_FALLBACK = true

export function stopSpeaking() {
  Speech.stop()
}

/**
 * Bacakan teks dengan bahasa tertentu.
 * Teks Arab dibacakan apa adanya pada perangkat yang mendukung; sebagai fallback
 * gunakan `latin` dengan suara Indonesia/Inggris agar lafal tidak kacau.
 */
export function speak(text, lang = "id", options = {}) {
  const value = String(text || "").trim()
  if (!value || options.enabled === false) return
  const useLatin = lang === "ar" && ARABIC_FALLBACK && options.latin
  Speech.stop()
  Speech.speak(useLatin ? options.latin : value, {
    language: useLatin ? LANGUAGE.id : LANGUAGE[lang] || LANGUAGE.id,
    rate: options.slow ? 0.62 : 0.85,
    pitch: 1.15
  })
}

/** Bacakan kata/frasa Arab dengan transliterasi bila perlu. */
export function speakWord(item, lang = "id", options = {}) {
  speak(item[lang] || item.en || "", lang, { ...options, latin: item.tr })
}
