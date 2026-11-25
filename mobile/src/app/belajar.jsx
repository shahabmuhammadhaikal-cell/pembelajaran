import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Button, Card, ProgressBar, Screen } from "../components/ui"
import { TOPICS, TOPIC_MAP, hardWordsFrom } from "../lib/data"
import { useKids } from "../lib/progress"
import { speak, speakWord, stopSpeaking } from "../lib/speech"
import { colors, radius, text } from "../lib/theme"

const LANG_LABEL = { id: "Indonesia", en: "Inggris", ar: "Arab" }

export default function LearnScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const topicId = String(params.topic || "")
  const { kids, actions } = useKids()
  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const spokenRef = useRef("")

  const hardWords = useMemo(() => hardWordsFrom(kids.mistakes), [kids.mistakes])
  const topic = useMemo(() => {
    if (topicId === "hard") {
      return {
        id: "hard",
        label: "Kata Sulit",
        emoji: "🩹",
        color: colors.red,
        blurb: "Kata yang sering salah",
        items: hardWords
      }
    }
    return TOPIC_MAP[topicId] || TOPICS[0]
  }, [topicId, hardWords])

  const total = topic.items.length
  const item = topic.items[Math.min(index, Math.max(0, total - 1))]
  const lang = kids.settings.lang || "id"
  const sound = kids.settings.sound !== false
  const slow = kids.settings.slow === true
  const isHijaiyah = topic.id === "hijaiyah"

  useEffect(() => {
    setIndex(0)
    setFinished(false)
  }, [topic.id])

  useEffect(() => {
    if (!hardWords.length && topicId === "hard") return
    actions.setLastTopic(topicId === "hard" ? kids.lastTopic : topic.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id])

  useEffect(() => {
    if (!item) return
    actions.markLearned(item.key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.key])

  useEffect(() => {
    if (!sound || !item || finished) return
    const text = isHijaiyah ? item.en : item[lang] || item.en
    if (spokenRef.current === `${topic.id}:${item.key}:${lang}`) return
    spokenRef.current = `${topic.id}:${item.key}:${lang}`
    const timer = setTimeout(() => {
      if (isHijaiyah) speak(text, "id")
      else speakWord(item, lang, { slow })
    }, 320)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item && item.key, lang, sound, slow, finished])

  useEffect(() => () => stopSpeaking(), [])

  const sayCurrent = useCallback(() => {
    if (!item) return
    if (isHijaiyah) speak(item.en, "id")
    else speakWord(item, lang, { slow })
  }, [item, isHijaiyah, lang, slow])

  const finish = useCallback(() => {
    if (!item) return
    stopSpeaking()
    if (topic.id === "hard") {
      actions.addStars(2)
      setFinished(true)
      return
    }
    const firstTime = !kids.topicsDone[topic.id]
    actions.finishTopic(topic.id)
    actions.unlockSticker(`topic-${topic.id}`)
    actions.addStars(firstTime ? 3 : 1)
    setFinished(true)
  }, [actions, kids.topicsDone, topic.id, item])

  if (!item) {
    return (
      <Screen>
        <Card style={styles.empty}>
          <Text style={text.h2}>Belum ada kata sulit 🎉</Text>
          <Text style={[text.muted, styles.center]}>
            Mainkan permainan dulu. Kata yang salah akan muncul di sini untuk diulang.
          </Text>
          <Button label="Kembali" onPress={() => router.back()} />
        </Card>
      </Screen>
    )
  }

  if (finished) {
    return (
      <Screen>
        <Card style={styles.result}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={text.h1}>Selesai!</Text>
          <Text style={[text.muted, styles.center]}>
            {topic.id === "hard"
              ? `Kamu mengulang ${hardWords.length} kata sulit.`
              : `Kamu sudah mengenal semua kata di topik ${topic.label}.`}
          </Text>
          <Text style={styles.stars}>{"⭐".repeat(topic.id === "hard" ? 2 : 3)}</Text>
          <Button label="Pilih topik lain" onPress={() => router.back()} />
          <Button
            label="Main permainan 🎮"
            variant="ghost"
            onPress={() => {
              if (router.canGoBack()) router.back()
              router.push("/permainan")
            }}
          />
        </Card>
      </Screen>
    )
  }

  const others = ["id", "en", "ar"].filter(code => code !== lang)
  const percent = Math.round(((index + 1) / total) * 100)
  const last = index === total - 1

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali">
          <Text style={styles.back}>← Kembali</Text>
        </Pressable>
        <Text style={styles.headTitle}>
          {topic.emoji} {topic.label}
        </Text>
        <Text style={styles.counter}>
          {index + 1}/{total}
        </Text>
      </View>

      <ProgressBar percent={percent} color={topic.color} />

      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.badge}>Kata {topic.label}</Text>
          <Text style={text.muted}>
            {index + 1} dari {total}
          </Text>
        </View>

        <Pressable onPress={sayCurrent} accessibilityRole="button" accessibilityLabel="Dengarkan kata">
          <Text style={styles.art}>{item.big && isHijaiyah ? item.big : item.emoji}</Text>
        </Pressable>

        {item.big && !isHijaiyah ? <Text style={styles.letter}>{item.big}</Text> : null}

        <Text style={[styles.word, lang === "ar" && styles.arabic]}>{item[lang] || item.en}</Text>
        {lang !== "ar" && item.tr ? <Text style={styles.tr}>{item.tr}</Text> : null}

        <View style={styles.audioRow}>
          <Button label="🔊 Dengar" size="sm" onPress={sayCurrent} />
          <Button
            label="🐢 Pelan"
            size="sm"
            variant="ghost"
            onPress={() => (isHijaiyah ? speak(item.en, "id", { slow: true }) : speakWord(item, lang, { slow: true }))}
          />
        </View>

        <View style={styles.translations}>
          {others.map(code => (
            <Pressable
              key={code}
              onPress={() =>
                isHijaiyah
                  ? speak(item.en, "id")
                  : speak(item[code] || "", code, { latin: item.tr, slow })
              }
              accessibilityRole="button"
              accessibilityLabel={`Dengarkan ${LANG_LABEL[code]}`}
              style={styles.translation}
            >
              <Text style={styles.tag}>{code.toUpperCase()}</Text>
              <Text style={[styles.translationText, code === "ar" && styles.arabic]}>
                {item[code] || "-"}
              </Text>
              <Text style={styles.speaker}>🔊</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <View style={styles.nav}>
        <Button
          label="← Sebelumnya"
          variant="ghost"
          disabled={index === 0}
          onPress={() => setIndex(value => Math.max(0, value - 1))}
        />
        {last ? (
          <Button label="Selesai 🎉" onPress={finish} />
        ) : (
          <Button label="Berikutnya →" onPress={() => setIndex(value => Math.min(total - 1, value + 1))} />
        )}
      </View>

      <Text style={[text.muted, styles.hint]}>
        Ketuk kartu untuk mendengar lagi. Setiap kata tersedia dalam tiga bahasa.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  back: { fontSize: 14, fontWeight: "800", color: colors.blue },
  headTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.ink },
  counter: { fontSize: 12, fontWeight: "800", color: colors.muted },
  card: { gap: 8, alignItems: "center" },
  cardTop: { flexDirection: "row", width: "100%", justifyContent: "space-between", alignItems: "center" },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.blue,
    backgroundColor: colors.softBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill
  },
  art: { fontSize: 120, lineHeight: 140, textAlign: "center" },
  letter: { fontSize: 46, fontWeight: "800", color: colors.ink },
  word: { fontSize: 30, fontWeight: "800", color: colors.ink, textAlign: "center" },
  arabic: { textAlign: "center", writingDirection: "rtl" },
  tr: { fontSize: 14, color: colors.muted, fontStyle: "italic" },
  audioRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  translations: { width: "100%", gap: 8, marginTop: 8 },
  translation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff"
  },
  tag: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.muted,
    backgroundColor: "#f1ecfb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill
  },
  translationText: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.ink },
  speaker: { fontSize: 16 },
  nav: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  hint: { textAlign: "center" },
  empty: { gap: 10, alignItems: "center", marginTop: 20 },
  result: { gap: 10, alignItems: "center", marginTop: 20 },
  resultEmoji: { fontSize: 64 },
  stars: { fontSize: 24 },
  center: { textAlign: "center" }
})
