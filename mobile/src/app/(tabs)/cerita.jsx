import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { Screen, SectionTitle } from "../../components/ui"
import { STORIES } from "../../lib/data"
import { useKids } from "../../lib/progress"
import { colors, radius, text } from "../../lib/theme"

export default function StoriesTab() {
  const router = useRouter()
  const { kids } = useKids()
  const read = useMemo(() => Object.keys(kids.stories).length, [kids.stories])

  return (
    <Screen>
      <SectionTitle
        emoji="📖"
        title="Cerita bergambar"
        subtitle={`${read}/${STORIES.length} cerita dibaca · tiga bahasa`}
      />

      {STORIES.map(story => {
        const wasRead = Boolean(kids.stories[story.id])
        return (
          <Pressable
            key={story.id}
            onPress={() => router.push(`/cerita/${story.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Baca cerita ${story.title}`}
            style={({ pressed }) => [
              styles.card,
              { borderLeftColor: story.color },
              wasRead && styles.done,
              pressed && { opacity: 0.85 }
            ]}
          >
            <View style={styles.cover}>
              {story.cover.map((emoji, position) => (
                <Text key={position} style={[styles.coverEmoji, position > 0 && styles.coverSmall]}>
                  {emoji}
                </Text>
              ))}
            </View>
            <View style={styles.body}>
              <Text style={text.h3}>
                {story.title} {wasRead ? "✓" : ""}
              </Text>
              <Text style={text.muted}>
                {story.level} · {story.sentences.length} kalimat
              </Text>
            </View>
            <Text style={styles.arrow}>▶</Text>
          </Pressable>
        )
      })}

      <Text style={[text.muted, styles.tip]}>
        💡 Tips: bacakan tiap kalimat dengan suara, lalu minta anak menirukannya sebelum lanjut.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderLeftWidth: 6,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#2b1c46",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  done: { backgroundColor: "#f3fdf8" },
  cover: { alignItems: "center", justifyContent: "center", width: 58, gap: 0 },
  coverEmoji: { fontSize: 26 },
  coverSmall: { fontSize: 16, marginTop: -6 },
  body: { flex: 1, gap: 2 },
  arrow: { fontSize: 12, color: colors.muted },
  tip: { textAlign: "center", paddingHorizontal: 8 }
})
