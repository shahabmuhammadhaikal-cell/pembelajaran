import { useCallback, useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Button, Card, ProgressBar, Screen } from "../../components/ui"
import { STORIES, STORY_MAP, shuffle } from "../../lib/data"
import { useKids } from "../../lib/progress"
import { speak, stopSpeaking } from "../../lib/speech"
import { colors, radius, text } from "../../lib/theme"

const LANG_LABEL = { id: "Indonesia", en: "Inggris", ar: "Arab" }

export default function StoryScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const story = STORY_MAP[String(params.id || "")] || STORIES[0]
  const { kids, actions } = useKids()
  const lang = kids.settings.lang || "id"
  const sound = kids.settings.sound !== false
  const slow = kids.settings.slow === true

  const [phase, setPhase] = useState("read")
  const [index, setIndex] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizSolved, setQuizSolved] = useState(false)
  const [quizWrong, setQuizWrong] = useState([])
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const [earned, setEarned] = useState(0)

  const questions = useMemo(
    () =>
      story.questions.map(question => ({
        q: question.q,
        correct: question.options[question.answer],
        options: shuffle(question.options)
      })),
    [story]
  )

  const sentence = story.sentences[Math.min(index, story.sentences.length - 1)]
  const spokenText = sentence[lang] || sentence.id
  const secondary = ["id", "en", "ar"].filter(code => code !== lang)[0]

  useEffect(() => {
    setPhase("read")
    setIndex(0)
    setQuizIndex(0)
    setQuizSolved(false)
    setQuizWrong([])
    setCorrect(0)
    setFinished(false)
  }, [story.id])

  useEffect(() => {
    if (!sound || phase !== "read" || finished) return
    const timer = setTimeout(
      () => speak(spokenText, lang, { latin: sentence.tr, slow }),
      320
    )
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenText, lang, sound, slow, phase, finished])

  useEffect(() => () => stopSpeaking(), [])

  const answer = useCallback(
    option => {
      if (quizSolved) return
      const current = questions[quizIndex]
      if (option === current.correct) {
        setQuizSolved(true)
        setCorrect(value => value + 1)
        if (sound) speak("Hebat!", "id")
      } else {
        setQuizWrong(previous =>
          previous.includes(option) ? previous : [...previous, option]
        )
      }
    },
    [quizSolved, questions, quizIndex, sound]
  )

  const nextQuestion = useCallback(() => {
    if (quizIndex + 1 >= questions.length) {
      const firstTime = !kids.stories[story.id]
      actions.readStory(story.id)
      const stars = firstTime ? 4 : 1
      actions.addStars(stars)
      if (firstTime) actions.unlockSticker(`story-${story.id}`)
      setEarned(stars)
      setFinished(true)
      return
    }
    setQuizIndex(value => value + 1)
    setQuizSolved(false)
    setQuizWrong([])
  }, [quizIndex, questions.length, kids.stories, story.id, actions])

  if (finished) {
    return (
      <Screen>
        <Card style={styles.result}>
          <Text style={styles.resultEmoji}>📖</Text>
          <Text style={text.h1}>Cerita selesai!</Text>
          <Text style={[text.muted, styles.center]}>
            {story.title} · kuis {correct}/{questions.length} benar.
          </Text>
          <Text style={styles.stars}>{"⭐".repeat(earned)}</Text>
          <Button label="Kembali ke daftar cerita" onPress={() => router.back()} />
        </Card>
      </Screen>
    )
  }

  if (phase === "quiz") {
    const current = questions[quizIndex]
    return (
      <Screen>
        <View style={styles.head}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali">
            <Text style={styles.back}>← Kembali</Text>
          </Pressable>
          <Text style={styles.headTitle}>🧠 Kuis cerita</Text>
          <Text style={styles.counter}>
            {quizIndex + 1}/{questions.length}
          </Text>
        </View>
        <ProgressBar percent={((quizIndex + (quizSolved ? 1 : 0)) / questions.length) * 100} />

        <Card style={styles.quizCard}>
          <Text style={styles.quizEmoji}>{story.emoji}</Text>
          <Text style={text.h2}>{current.q}</Text>
          <View style={styles.quizOptions}>
            {current.options.map(option => {
              const isRight = quizSolved && option === current.correct
              const isWrong = quizWrong.includes(option)
              return (
                <Pressable
                  key={option}
                  onPress={() => answer(option)}
                  disabled={quizSolved || isWrong}
                  accessibilityRole="button"
                  accessibilityLabel={`Jawaban ${option}`}
                  style={[
                    styles.quizOption,
                    isRight && styles.quizRight,
                    isWrong && styles.quizWrong,
                    quizSolved && !isRight && { opacity: 0.45 }
                  ]}
                >
                  <Text style={styles.quizOptionText}>{option}</Text>
                </Pressable>
              )
            })}
          </View>
          {quizSolved ? (
            <Button
              label={quizIndex + 1 >= questions.length ? "Selesaikan" : "Pertanyaan berikutnya →"}
              size="sm"
              onPress={nextQuestion}
            />
          ) : (
            <Text style={text.muted}>
              {quizWrong.length ? "Belum tepat, ingat lagi ceritanya ya 🙂" : "Pilih satu jawaban."}
            </Text>
          )}
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali">
          <Text style={styles.back}>← Kembali</Text>
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>
          {story.emoji} {story.title}
        </Text>
        <Text style={styles.counter}>
          {index + 1}/{story.sentences.length}
        </Text>
      </View>

      <ProgressBar percent={((index + 1) / story.sentences.length) * 100} color={story.color} />

      <Card style={[styles.scene, { borderColor: `${story.color}55` }]}>
        <Text style={styles.sceneEmoji}>{sentence.emoji}</Text>
      </Card>

      <Card style={styles.textCard}>
        <Text style={[text.h2, lang === "ar" && styles.arabic]}>{spokenText}</Text>
        <Text style={text.muted}>
          <Text style={styles.tag}>{secondary.toUpperCase()}</Text>{" "}
          <Text style={secondary === "ar" ? styles.arabicSmall : undefined}>
            {sentence[secondary]}
          </Text>
        </Text>

        <View style={styles.audioRow}>
          <Button
            label="🔊 Dengar"
            size="sm"
            onPress={() => speak(spokenText, lang, { latin: sentence.tr, slow })}
          />
          <Button
            label="🐢 Pelan"
            size="sm"
            variant="ghost"
            onPress={() => speak(spokenText, lang, { latin: sentence.tr, slow: true })}
          />
        </View>
        <Text style={styles.langHint}>Bacakan dalam bahasa {LANG_LABEL[lang]}.</Text>
      </Card>

      <View style={styles.nav}>
        <Button
          label="← Sebelumnya"
          variant="ghost"
          disabled={index === 0}
          onPress={() => setIndex(value => Math.max(0, value - 1))}
        />
        {index + 1 >= story.sentences.length ? (
          <Button
            label="Kuis cerita 🎉"
            onPress={() => {
              stopSpeaking()
              setPhase("quiz")
            }}
          />
        ) : (
          <Button label="Berikutnya →" onPress={() => setIndex(value => value + 1)} />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  back: { fontSize: 14, fontWeight: "800", color: colors.blue },
  headTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.ink },
  counter: { fontSize: 12, fontWeight: "800", color: colors.muted },
  scene: { alignItems: "center", paddingVertical: 18, backgroundColor: "#fff" },
  sceneEmoji: { fontSize: 96 },
  textCard: { gap: 8 },
  tag: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    backgroundColor: "#f1ecfb",
    paddingHorizontal: 6,
    borderRadius: radius.pill
  },
  arabic: { textAlign: "right", writingDirection: "rtl" },
  arabicSmall: { textAlign: "left", writingDirection: "rtl" },
  audioRow: { flexDirection: "row", gap: 8 },
  langHint: { fontSize: 11, color: colors.muted },
  nav: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  quizCard: { gap: 10, alignItems: "stretch" },
  quizEmoji: { fontSize: 44, textAlign: "center" },
  quizOptions: { gap: 8 },
  quizOption: {
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff"
  },
  quizOptionText: { fontSize: 15, fontWeight: "700", color: colors.ink },
  quizRight: { backgroundColor: colors.softGreen, borderColor: "#8fe6bb" },
  quizWrong: { backgroundColor: "#ffecec", borderColor: "#ffb4b4" },
  result: { gap: 10, alignItems: "center", marginTop: 20 },
  resultEmoji: { fontSize: 60 },
  stars: { fontSize: 24 },
  center: { textAlign: "center" }
})
