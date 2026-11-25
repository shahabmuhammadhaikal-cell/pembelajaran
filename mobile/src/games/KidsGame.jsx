import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Button, Card, Chip, ProgressBar } from "../components/ui"
import { PLAY_ITEMS, SENTENCES, roundsFor, shuffle } from "../lib/data"
import { speak, speakWord, stopSpeaking } from "../lib/speech"
import { colors, radius, text } from "../lib/theme"

export const GAMES = [
  {
    id: "guess",
    emoji: "🔍",
    name: "Tebak Kata",
    desc: "Lihat gambar, pilih tulisannya",
    color: colors.orange,
    base: 8,
    pass: score => score >= 6
  },
  {
    id: "listen",
    emoji: "🎧",
    name: "Dengar & Pilih",
    desc: "Dengarkan suara, pilih gambarnya",
    color: colors.blue,
    base: 10,
    pass: score => score >= 8
  },
  {
    id: "sentence",
    emoji: "🧱",
    name: "Susun Kalimat",
    desc: "Susun kata jadi kalimat Inggris",
    color: "#f97316",
    base: 5,
    pass: (score, total) => score >= Math.ceil(total * 0.8)
  },
  {
    id: "letter",
    emoji: "🅰️",
    name: "Huruf Awal",
    desc: "Tebak huruf pertama kata Inggris",
    color: "#0ea5e9",
    base: 8,
    pass: score => score >= 6
  }
]

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

function uniqueBy(list, valueOf) {
  const seen = new Set()
  const output = []
  for (const entry of list) {
    const value = valueOf(entry)
    if (seen.has(value)) continue
    seen.add(value)
    output.push(entry)
  }
  return output
}

function buildRounds(mode, count, lang) {
  if (mode === "sentence") {
    return shuffle(SENTENCES)
      .slice(0, count)
      .map(item => {
        const words = String(item.en).split(/\s+/).filter(Boolean)
        return {
          uid: item.key,
          item,
          answer: words.join(" "),
          tokens: shuffle(words.map((word, index) => ({ word, id: `${item.key}-${index}` })))
        }
      })
  }

  const pool = PLAY_ITEMS.filter(entry => entry.emoji)
  const targets = shuffle(uniqueBy(pool, entry => `${entry.topicId}:${entry.key}`)).slice(0, count)

  return targets.map((target, index) => {
    const uid = `${target.topicId}:${target.key}`
    if (mode === "letter") {
      const letter = String(target.en).charAt(0).toUpperCase()
      const distractors = shuffle(LETTERS.filter(value => value !== letter)).slice(0, 3)
      return { uid, target, letter, options: shuffle([letter, ...distractors]) }
    }
    const others = shuffle(
      pool.filter(entry => entry.emoji !== target.emoji && entry[lang] !== target[lang])
    )
    const seenEmoji = new Set([target.emoji])
    const distractors = []
    for (const entry of others) {
      if (seenEmoji.has(entry.emoji)) continue
      seenEmoji.add(entry.emoji)
      distractors.push(entry)
      if (distractors.length === 3) break
    }
    return {
      uid,
      target,
      options: shuffle([target, ...distractors]).map(entry => ({
        ...entry,
        uid: `${entry.topicId}:${entry.key}:${index}`,
        isTarget: entry.topicId === target.topicId && entry.key === target.key
      }))
    }
  })
}

/** Mesin permainan Mode Anak: tebak kata, dengar & pilih, susun kalimat, huruf awal. */
export default function KidsGame({ mode, settings, onExit, onFinish, onMistake }) {
  const lang = settings.lang || "id"
  const sound = settings.sound !== false
  const slow = settings.slow === true
  const meta = GAMES.find(game => game.id === mode) || GAMES[0]
  const total = roundsFor(settings.length, meta.base)
  const [seed, setSeed] = useState(0)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [solved, setSolved] = useState(false)
  const [wrong, setWrong] = useState([])
  const [picked, setPicked] = useState([])
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const finishedRef = useRef(false)

  const rounds = useMemo(() => buildRounds(mode, total, lang), [mode, total, lang, seed])
  const current = rounds[round]

  useEffect(() => {
    stopSpeaking()
    return () => stopSpeaking()
  }, [mode])

  useEffect(() => {
    if (mode !== "listen" || !current || done) return
    if (sound) speakWord(current.target, lang, { slow })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, round, seed, lang, sound, slow, done])

  useEffect(() => {
    if (!done || finishedRef.current) return
    finishedRef.current = true
    onFinish({ gameId: mode, score, total: rounds.length })
  }, [done, score, rounds.length, mode, onFinish])

  const restart = useCallback(() => {
    finishedRef.current = false
    stopSpeaking()
    setSeed(value => value + 1)
    setRound(0)
    setScore(0)
    setSolved(false)
    setWrong([])
    setPicked([])
    setShake(false)
    setDone(false)
  }, [])

  const next = useCallback(() => {
    if (round + 1 >= rounds.length) {
      setDone(true)
      return
    }
    setRound(value => value + 1)
    setSolved(false)
    setWrong([])
    setPicked([])
    setShake(false)
  }, [round, rounds.length])

  const markWrong = useCallback(() => {
    if (!current) return
    if (mode === "sentence") onMistake?.("sentence", current.item.key)
    else if (mode === "letter") onMistake?.(current.target.topicId, current.target.key)
    else onMistake?.(current.target.topicId, current.target.key)
  }, [mode, current, onMistake])

  const chooseOption = useCallback(
    option => {
      if (solved || !current) return
      if (mode === "letter" ? option === current.letter : option.isTarget) {
        setSolved(true)
        if (!wrong.length) setScore(value => value + 1)
        if (sound) {
          if (mode === "letter") speak(current.letter, "en")
          else speakWord(current.target, lang, { slow })
        }
        return
      }
      setWrong(previous => [...previous, mode === "letter" ? option : option.uid])
      if (!wrong.length) markWrong()
    },
    [solved, current, mode, wrong.length, sound, lang, slow, markWrong]
  )

  const pickToken = useCallback(
    token => {
      if (solved || !current || picked.some(entry => entry.id === token.id)) return
      const nextPicked = [...picked, token]
      setPicked(nextPicked)
      if (nextPicked.length < current.tokens.length) return
      const sentence = nextPicked.map(entry => entry.word).join(" ")
      if (sentence === current.answer) {
        setSolved(true)
        setScore(value => value + 1)
        if (sound) speak(current.item.en, "en", { slow })
      } else {
        setShake(true)
        if (!wrong.length) markWrong()
        setWrong(["salah"])
        setTimeout(() => {
          setPicked([])
          setShake(false)
        }, 700)
      }
    },
    [solved, current, picked, wrong.length, sound, slow, markWrong]
  )

  if (!current) {
    return (
      <View style={styles.wrap}>
        <Text style={text.h2}>Belum ada soal.</Text>
        <Button label="Kembali" onPress={onExit} />
      </View>
    )
  }

  if (done) {
    const passed = meta.pass(score, rounds.length)
    return (
      <View style={styles.wrap}>
        <Card style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{passed ? "🏅" : "🌟"}</Text>
          <Text style={text.h2}>{passed ? "Hebat sekali!" : "Permainan selesai!"}</Text>
          <Text style={[text.muted, styles.center]}>
            Jawaban benar {score} dari {rounds.length}.
          </Text>
          <Text style={styles.stars}>{"⭐".repeat(Math.max(1, Math.min(5, Math.round((score / rounds.length) * 5))))}</Text>
          <Button label="Main lagi 🔄" onPress={restart} />
          <Button label="Pilih permainan lain" variant="ghost" onPress={onExit} />
        </Card>
      </View>
    )
  }

  const progress = ((round + (solved ? 1 : 0)) / rounds.length) * 100

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Pressable onPress={onExit} accessibilityRole="button" accessibilityLabel="Kembali">
          <Text style={styles.back}>← Kembali</Text>
        </Pressable>
        <Text style={styles.title}>
          {meta.emoji} {meta.name}
        </Text>
        <Text style={styles.counter}>
          {round + 1}/{rounds.length}
        </Text>
      </View>

      <ProgressBar percent={progress} color={meta.color} />

      {mode === "guess" ? (
        <>
          <Card style={styles.centerCard}>
            <Text style={styles.bigEmoji}>{current.target.emoji}</Text>
            <Text style={text.h3}>Ini apa ya?</Text>
            <Text style={text.muted}>Pilih tulisan yang cocok dengan gambarnya.</Text>
          </Card>
          <View style={styles.options}>
            {current.options.map(option => {
              const isWrong = wrong.includes(option.uid)
              const isRight = solved && option.isTarget
              return (
                <Pressable
                  key={option.uid}
                  onPress={() => chooseOption(option)}
                  disabled={solved || isWrong}
                  accessibilityRole="button"
                  accessibilityLabel={`Pilihan ${option[lang] || option.en}`}
                  style={[
                    styles.option,
                    isRight && styles.optionRight,
                    isWrong && styles.optionWrong,
                    solved && !isRight && styles.optionDim
                  ]}
                >
                  <Text style={styles.optionText}>{option[lang] || option.en}</Text>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {mode === "listen" ? (
        <>
          <Card style={styles.centerCard}>
            <Pressable
              onPress={() => speakWord(current.target, lang, { slow })}
              accessibilityRole="button"
              accessibilityLabel="Ulangi suara"
              style={styles.speaker}
            >
              <Text style={styles.speakerEmoji}>🔊</Text>
            </Pressable>
            <Text style={text.h3}>Dengarkan, lalu pilih gambarnya!</Text>
            <Text style={[text.muted, styles.center]}>Ketuk pengeras suara untuk mendengar lagi.</Text>
          </Card>
          <View style={styles.emojis}>
            {current.options.map(option => {
              const isWrong = wrong.includes(option.uid)
              const isRight = solved && option.isTarget
              return (
                <Pressable
                  key={option.uid}
                  onPress={() => chooseOption(option)}
                  disabled={solved || isWrong}
                  accessibilityRole="button"
                  accessibilityLabel={solved ? option[lang] : "Pilih gambar ini"}
                  style={[
                    styles.emojiTile,
                    isRight && styles.optionRight,
                    isWrong && styles.optionWrong,
                    solved && !isRight && styles.optionDim
                  ]}
                >
                  <Text style={styles.tileEmoji}>{option.emoji}</Text>
                  {solved ? <Text style={styles.tileLabel}>{option[lang]}</Text> : null}
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {mode === "letter" ? (
        <>
          <Card style={styles.centerCard}>
            <Text style={styles.bigEmoji}>{current.target.emoji}</Text>
            <Text style={text.h3}>Huruf pertamanya apa?</Text>
            <Text style={[text.muted, styles.center]}>
              {current.target.id} · kata Inggrisnya {solved ? current.target.en : "diawali huruf…"}
            </Text>
          </Card>
          <View style={styles.letters}>
            {current.options.map(letter => {
              const isWrong = wrong.includes(letter)
              const isRight = solved && letter === current.letter
              return (
                <Pressable
                  key={letter}
                  onPress={() => chooseOption(letter)}
                  disabled={solved || isWrong}
                  accessibilityRole="button"
                  accessibilityLabel={`Huruf ${letter}`}
                  style={[
                    styles.letterTile,
                    isRight && styles.optionRight,
                    isWrong && styles.optionWrong
                  ]}
                >
                  <Text style={styles.letterText}>{letter}</Text>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : null}

      {mode === "sentence" ? (
        <Card style={styles.sentenceCard}>
          <View style={styles.sentenceHead}>
            <Text style={styles.bigEmojiSmall}>{current.item.emoji}</Text>
            <View style={styles.flex}>
              <Text style={text.h3}>Susun kalimat Inggrisnya!</Text>
              <Text style={text.muted}>Artinya: {current.item.id}</Text>
              <Text style={styles.arabic}>{current.item.ar}</Text>
            </View>
          </View>

          <View style={[styles.slots, shake && styles.shake]}>
            {current.tokens.map((_, index) => {
              const filled = picked[index]
              return (
                <Pressable
                  key={`slot-${index}`}
                  onPress={() =>
                    !solved && filled && setPicked(previous => previous.filter((_, i) => i !== index))
                  }
                  disabled={!filled || solved}
                  accessibilityRole="button"
                  accessibilityLabel={filled ? `Hapus kata ${filled.word}` : "Tempat kata kosong"}
                  style={[styles.slot, filled && styles.slotFilled]}
                >
                  <Text style={styles.slotText}>{filled ? filled.word : ""}</Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.tokens}>
            {current.tokens.map(token => {
              const used = picked.some(entry => entry.id === token.id)
              return (
                <Pressable
                  key={token.id}
                  onPress={() => pickToken(token)}
                  disabled={used || solved}
                  accessibilityRole="button"
                  accessibilityLabel={`Kata ${token.word}`}
                  style={[styles.token, used && styles.tokenUsed]}
                >
                  <Text style={styles.tokenText}>{token.word}</Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.tools}>
            <Chip
              label="🔊 Petunjuk"
              onPress={() => speakWord(current.item, lang, { slow })}
              accessibilityLabel="Dengarkan petunjuk"
            />
            <Chip
              label="🔊 Kalimat"
              onPress={() => speak(current.item.en, "en", { slow })}
              accessibilityLabel="Dengarkan kalimat Inggris"
            />
            <Chip
              label="🧽 Hapus"
              onPress={() => !solved && setPicked([])}
              accessibilityLabel="Hapus semua kata"
            />
          </View>
        </Card>
      ) : null}

      <View style={styles.feedback}>
        {solved ? (
          <>
            <Text style={styles.feedbackGood}>
              Benar! {current.item ? current.item.en : mode === "letter" ? current.letter : current.target[lang]}
            </Text>
            <Button
              label={round + 1 >= rounds.length ? "Lihat hasil" : "Lanjut →"}
              size="sm"
              onPress={next}
            />
          </>
        ) : (
          <Text style={text.muted}>
            {wrong.length ? "Belum tepat, coba lagi ya 🙂" : "Pilih jawaban yang benar."}
          </Text>
        )}
      </View>

      <Text style={styles.score}>⭐ {score}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  back: { fontSize: 14, fontWeight: "800", color: colors.blue },
  title: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.ink, textAlign: "center" },
  counter: { fontSize: 12, fontWeight: "800", color: colors.muted },
  centerCard: { alignItems: "center", gap: 6 },
  center: { textAlign: "center" },
  bigEmoji: { fontSize: 84, lineHeight: 100 },
  bigEmojiSmall: { fontSize: 42, lineHeight: 50 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff",
    shadowColor: "#2b1c46",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  optionText: { fontSize: 17, fontWeight: "800", color: colors.ink, textAlign: "center" },
  optionRight: { backgroundColor: colors.softGreen, borderColor: "#8fe6bb" },
  optionWrong: { backgroundColor: "#ffecec", borderColor: "#ffb4b4" },
  optionDim: { opacity: 0.45 },
  emojis: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emojiTile: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff",
    elevation: 3
  },
  tileEmoji: { fontSize: 44 },
  tileLabel: { fontSize: 12, fontWeight: "800", color: colors.muted, textAlign: "center" },
  speaker: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softBlue,
    borderWidth: 3,
    borderColor: "#cfe2ff"
  },
  speakerEmoji: { fontSize: 40 },
  letters: { flexDirection: "row", gap: 10 },
  letterTile: {
    flex: 1,
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff",
    elevation: 3
  },
  letterText: { fontSize: 30, fontWeight: "800", color: colors.ink },
  sentenceCard: { gap: 12 },
  sentenceHead: { flexDirection: "row", gap: 10, alignItems: "center" },
  arabic: { fontSize: 14, color: colors.muted, textAlign: "right", writingDirection: "rtl" },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8, minHeight: 56 },
  shake: { transform: [{ translateX: 4 }] },
  slot: {
    minWidth: 62,
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#d9ccf7",
    backgroundColor: "#fff"
  },
  slotFilled: { borderStyle: "solid", borderColor: colors.purple, backgroundColor: "#f3ecff" },
  slotText: { fontSize: 15, fontWeight: "800", color: colors.ink },
  tokens: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  token: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: "#ffd9b5",
    backgroundColor: "#fff7ee"
  },
  tokenUsed: { opacity: 0.25 },
  tokenText: { fontSize: 15, fontWeight: "800", color: colors.ink },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feedback: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#fff"
  },
  feedbackGood: { flex: 1, fontSize: 14, fontWeight: "800", color: "#0f8a5f" },
  score: { position: "absolute", right: 16, bottom: 12, fontSize: 12, fontWeight: "800", color: colors.muted },
  resultCard: { gap: 10, alignItems: "center", marginTop: 30 },
  resultEmoji: { fontSize: 64 },
  stars: { fontSize: 22 }
})
