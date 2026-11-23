/**
 * Audio mode anak: suara Web Speech yang lebih ceria (pitch tinggi, tempo pelan)
 * + efek suara ringan (Web Audio) tanpa file aset.
 */

import { loadVoices, pickVoice, speak as fallbackSpeak } from "./speech.js"

let ctx = null

function getCtx() {
  if (typeof window === "undefined") return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === "suspended") ctx.resume().catch(() => {})
  return ctx
}

/** Panggil pada interaksi pertama agar audio diizinkan browser. */
export function unlockKidsAudio() {
  getCtx()
}

function tone(freq, at, duration, type = "sine", level = 0.16) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(at)
  osc.stop(at + duration + 0.03)
}

function glide(from, to, at, duration, type = "sine", level = 0.14) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + duration)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(level, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(at)
  osc.stop(at + duration + 0.03)
}

/** Efek suara: tap | correct | wrong | win | star | pop */
export function playSfx(name) {
  const audio = getCtx()
  if (!audio) return
  const now = audio.currentTime + 0.01
  switch (name) {
    case "tap":
      tone(680, now, 0.07, "sine", 0.1)
      break
    case "pop":
      glide(420, 880, now, 0.12, "triangle", 0.12)
      break
    case "correct":
      ;[523.25, 659.25, 783.99].forEach((freq, index) => tone(freq, now + index * 0.08, 0.2, "triangle", 0.14))
      break
    case "wrong":
      glide(280, 150, now, 0.22, "sawtooth", 0.09)
      break
    case "star":
      ;[1046.5, 1318.5, 1568].forEach((freq, index) => tone(freq, now + index * 0.06, 0.18, "sine", 0.1))
      break
    case "win":
      ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, index) =>
        tone(freq, now + index * 0.12, 0.32, "triangle", 0.15)
      )
      tone(261.6, now, 0.7, "sine", 0.08)
      break
    default:
      break
  }
}

/**
 * Ucapkan teks dengan suara ramah anak.
 * @param {string} text
 * @param {"id"|"en"|"ar"} lang
 * @param {{slow?: boolean, rate?: number}} options
 */
export function kidSay(text, lang = "id", options = {}) {
  const value = String(text || "").trim()
  if (!value) return
  if (typeof window === "undefined") return
  if (!("speechSynthesis" in window)) {
    fallbackSpeak(value, lang)
    return
  }
  loadVoices()
  const synth = window.speechSynthesis
  synth.cancel()
  try {
    const utterance = new SpeechSynthesisUtterance(value)
    const voice = pickVoice(lang)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "id-ID"
    }
    utterance.rate = options.rate || (options.slow ? 0.55 : 0.82)
    utterance.pitch = 1.25
    utterance.volume = 1
    synth.speak(utterance)
  } catch {
    fallbackSpeak(value, lang)
  }
}

/**
 * Apakah perangkat punya suara untuk bahasa ini?
 * Dipakai agar nama huruf Arab tidak dibacakan suara bahasa lain (hasilnya kacau).
 * @param {"id"|"en"|"ar"} lang
 */
export function hasVoiceFor(lang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false
  loadVoices()
  return Boolean(pickVoice(lang))
}

/**
 * Teks & bahasa yang benar-benar diucapkan.
 * Teks Arab dibacakan apa adanya bila perangkat punya suara Arab; bila tidak,
 * dibacakan transliterasinya (`latin`) dengan suara Indonesia/Inggris agar lafal tidak kacau.
 * @param {{text: string, lang: "id"|"en"|"ar", latin?: string}} input
 * @returns {{text: string, code: "id"|"en"|"ar"}}
 */
export function kidSpeech({ text, lang, latin = "" }) {
  if (lang !== "ar") return { text, code: lang }
  if (!latin || hasVoiceFor("ar")) return { text, code: "ar" }
  return { text: latin, code: hasVoiceFor("id") ? "id" : "en" }
}

/**
 * Bacakan teks dengan pelafalan yang tepat: teks Arab hanya diucapkan bila
 * perangkat punya suara Arab, selain itu transliterasinya (lihat `kidSpeech`).
 * @param {{text: string, lang: "id"|"en"|"ar", latin?: string}} input
 * @param {{slow?: boolean, rate?: number}} options
 */
export function kidSaySpeech({ text, lang, latin = "" }, options = {}) {
  const speech = kidSpeech({ text, lang, latin })
  kidSay(speech.text, speech.code, options)
}

export function stopKidsAudio() {
  if (typeof window === "undefined") return
  if ("speechSynthesis" in window) window.speechSynthesis.cancel()
}
