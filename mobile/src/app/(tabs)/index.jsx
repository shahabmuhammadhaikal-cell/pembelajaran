import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { Button, Card, Chip, ProgressBar, Screen, SectionTitle } from "../../components/ui"
import {
  TOPICS,
  TOTAL_WORDS,
  hardWordsFrom,
  levelProgress,
  topicGroups
} from "../../lib/data"
import { useKids } from "../../lib/progress"
import { colors, radius, text } from "../../lib/theme"

const FILTERS = [
  { id: "all", label: "Semua topik" },
  { id: "todo", label: "Belum selesai" },
  { id: "done", label: "Sudah selesai" }
]

export default function HomeScreen() {
  const router = useRouter()
  const { kids } = useKids()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const groups = useMemo(() => topicGroups(), [])
  const hardWords = useMemo(() => hardWordsFrom(kids.mistakes), [kids.mistakes])
  const mastered = useMemo(
    () => TOPICS.reduce((sum, topic) => sum + topic.items.filter(item => kids.learned[item.key]).length, 0),
    [kids.learned]
  )
  const doneTopics = Object.keys(kids.topicsDone).length
  const level = levelProgress(kids.stars)
  const resume =
    groups.flatMap(group => group.topics).find(topic => topic.id === kids.lastTopic) ||
    TOPICS.find(topic => !kids.topicsDone[topic.id]) ||
    TOPICS[0]

  const search = query.trim().toLowerCase()
  const visibleGroups = groups
    .map(group => ({
      ...group,
      topics: group.topics.filter(topic => {
        const done = Boolean(kids.topicsDone[topic.id])
        if (filter === "todo" && done) return false
        if (filter === "done" && !done) return false
        if (!search) return true
        if (`${topic.label} ${topic.blurb}`.toLowerCase().includes(search)) return true
        return topic.items.some(item =>
          [item.id, item.en, item.ar, item.tr].some(value =>
            String(value || "").toLowerCase().includes(search)
          )
        )
      })
    }))
    .filter(group => group.topics.length)

  return (
    <Screen edges={["top"]}>
      <View style={styles.hero}>
        <Text style={styles.mascot}>🦉</Text>
        <View style={styles.heroCopy}>
          <Text style={text.h1}>Ayo belajar sambil bermain!</Text>
          <Text style={text.muted}>
            Kumpulkan bintang ⭐, naik level, dan buka stiker rahasia bersama Burhan si burung hantu.
          </Text>
        </View>
      </View>

      <Card style={styles.levelCard}>
        <Text style={styles.levelAvatar}>{level.current.avatar}</Text>
        <View style={styles.flex}>
          <Text style={text.h3}>
            Level {level.current.level} · {level.current.title}
          </Text>
          <ProgressBar percent={level.percent} color={colors.purple} />
          <Text style={text.muted}>
            {level.next
              ? `${level.next.min - kids.stars} ⭐ lagi ke level ${level.next.level}`
              : "Level maksimal! Luar biasa 🎉"}
          </Text>
        </View>
        <Text style={styles.stars}>⭐ {kids.stars}</Text>
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{mastered}</Text>
          <Text style={styles.statLabel}>kata dikuasai</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {doneTopics}/{TOPICS.length}
          </Text>
          <Text style={styles.statLabel}>topik selesai</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{TOTAL_WORDS}</Text>
          <Text style={styles.statLabel}>kata tersedia</Text>
        </View>
      </View>

      <Card style={[styles.resumeCard, { borderLeftColor: resume.color, borderLeftWidth: 8 }]}>
        <View style={styles.flex}>
          <Text style={styles.resumeKicker}>{kids.lastTopic ? "🧭 Lanjutkan belajar" : "🌟 Mulai petualangan"}</Text>
          <Text style={text.h2}>
            {resume.emoji} {resume.label}
          </Text>
          <Text style={text.muted}>
            {resume.items.filter(item => kids.learned[item.key]).length}/{resume.items.length} kata dikenal ·{" "}
            {resume.blurb}
          </Text>
        </View>
        <Button
          label="Buka →"
          size="sm"
          onPress={() => router.push(`/belajar?topic=${resume.id}`)}
        />
      </Card>

      {hardWords.length ? (
        <Card style={styles.hardCard}>
          <Text style={text.h3}>🩹 Kata sulit · {hardWords.length}</Text>
          <Text style={text.muted}>Kata yang pernah salah di permainan, ulangi sampai hafal.</Text>
          <View style={styles.hardRow}>
            {hardWords.slice(0, 4).map(word => (
              <Text key={word.signature} style={styles.hardChip}>
                {word.emoji} {word[kids.settings.lang] || word.en} ×{word.count}
              </Text>
            ))}
          </View>
          <Button label="Ulangi sekarang →" size="sm" onPress={() => router.push("/belajar?topic=hard")} />
        </Card>
      ) : null}

      <SectionTitle emoji="🗂️" title="Pilih topik belajar" subtitle={`${TOPICS.length} topik`} />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Cari kata atau topik, misal: kucing, apple…"
        placeholderTextColor="#a79bbb"
        accessibilityLabel="Cari kata atau topik"
        style={styles.search}
      />

      <View style={styles.filters}>
        {FILTERS.map(item => (
          <Chip
            key={item.id}
            label={item.label}
            active={filter === item.id}
            onPress={() => setFilter(item.id)}
          />
        ))}
      </View>

      {visibleGroups.length ? (
        visibleGroups.map(group => (
          <View key={group.id} style={styles.group}>
            <SectionTitle
              emoji={group.emoji}
              title={group.title}
              subtitle={`${group.topics.length} topik`}
            />
            <View style={styles.grid}>
              {group.topics.map(topic => {
                const learned = topic.items.filter(item => kids.learned[item.key]).length
                const percent = Math.round((learned / topic.items.length) * 100)
                const done = Boolean(kids.topicsDone[topic.id])
                return (
                  <Pressable
                    key={topic.id}
                    onPress={() => router.push(`/belajar?topic=${topic.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Belajar ${topic.label}, ${learned} dari ${topic.items.length} kata`}
                    style={({ pressed }) => [
                      styles.topic,
                      { borderTopColor: topic.color },
                      done && styles.topicDone,
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <View style={styles.topicTop}>
                      <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                      <Text style={[styles.percent, { color: done ? "#0f8a5f" : topic.color }]}>
                        {percent === 100 ? "✓" : `${percent}%`}
                      </Text>
                    </View>
                    <Text style={styles.topicName}>{topic.label}</Text>
                    <Text style={styles.topicBlurb} numberOfLines={2}>
                      {topic.blurb}
                    </Text>
                    <ProgressBar percent={percent} color={topic.color} height={8} />
                    <Text style={styles.topicMeta}>
                      {learned}/{topic.items.length} kata
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))
      ) : (
        <Text style={text.muted}>Tidak ada topik yang cocok. Coba kata lain ya.</Text>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", gap: 12, alignItems: "center" },
  mascot: { fontSize: 56 },
  heroCopy: { flex: 1, gap: 4 },
  levelCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  levelAvatar: { fontSize: 38 },
  flex: { flex: 1, gap: 6 },
  stars: { fontSize: 14, fontWeight: "800", color: colors.ink },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.line
  },
  statValue: { fontSize: 16, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, textAlign: "center" },
  resumeCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  resumeKicker: { fontSize: 11, fontWeight: "800", color: colors.blue, letterSpacing: 0.4 },
  hardCard: { gap: 8, borderColor: "#ffd6dd" },
  hardRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  hardChip: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    backgroundColor: "#fff",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#ffd6dd",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  search: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.ink
  },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  group: { gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  topic: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 4,
    padding: 12,
    borderRadius: radius.lg,
    borderTopWidth: 6,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#fff",
    shadowColor: "#2b1c46",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  topicDone: { backgroundColor: "#f2fdf8" },
  topicTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicEmoji: { fontSize: 30 },
  percent: { fontSize: 11, fontWeight: "800" },
  topicName: { fontSize: 15, fontWeight: "800", color: colors.ink },
  topicBlurb: { fontSize: 11.5, color: colors.muted, minHeight: 30 },
  topicMeta: { fontSize: 10.5, fontWeight: "800", color: colors.muted }
})
