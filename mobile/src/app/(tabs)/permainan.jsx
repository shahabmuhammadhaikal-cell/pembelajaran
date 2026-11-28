import { useCallback, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { Card, Screen, SectionTitle } from "../../components/ui"
import KidsGame, { GAMES } from "../../games/KidsGame"
import { useKids } from "../../lib/progress"
import { colors, radius, text } from "../../lib/theme"

export default function GamesTab() {
  const { kids, actions } = useKids()
  const [mode, setMode] = useState(null)

  const bestLabel = useCallback(
    game => {
      if (game.id === "sentence") {
        const value = kids.best.sentence || 0
        return value ? `rekor ${value} kalimat` : "belum dicoba"
      }
      const value = kids.best[game.id] || 0
      return value ? `rekor ${value}` : "belum dicoba"
    },
    [kids.best]
  )

  const handleFinish = useCallback(
    ({ gameId, score, total }) => {
      const meta = GAMES.find(game => game.id === gameId)
      actions.recordBest(gameId, score)
      actions.addStars(2)
      if (meta && meta.pass(score, total)) actions.unlockSticker(`game-${gameId}`)
    },
    [actions]
  )

  const played = useMemo(() => Object.values(kids.best).filter(value => value > 0).length, [kids.best])

  if (mode) {
    return (
      <Screen scroll={false} edges={["top"]} contentStyle={styles.gameScreen}>
        <KidsGame
          mode={mode}
          settings={kids.settings}
          onExit={() => setMode(null)}
          onFinish={handleFinish}
          onMistake={actions.recordMistake}
        />
      </Screen>
    )
  }

  return (
    <Screen edges={["top"]}>
      <SectionTitle emoji="🎮" title="Mainkan dulu, yuk!" subtitle={`${played} permainan sudah dicoba`} />

      {GAMES.map(game => (
        <Pressable
          key={game.id}
          onPress={() => setMode(game.id)}
          accessibilityRole="button"
          accessibilityLabel={`Main ${game.name}`}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.emojiBox, { backgroundColor: `${game.color}22` }]}>
            <Text style={styles.emoji}>{game.emoji}</Text>
          </View>
          <View style={styles.body}>
            <Text style={text.h2}>{game.name}</Text>
            <Text style={text.muted}>{game.desc}</Text>
            <Text style={[styles.best, { color: game.color }]}>{bestLabel(game)}</Text>
          </View>
          <Text style={styles.arrow}>▶</Text>
        </Pressable>
      ))}

      <Card style={styles.tipCard}>
        <Text style={text.h3}>🩹 Kata sulit ikut tercatat</Text>
        <Text style={text.muted}>
          Setiap jawaban salah dikumpulkan di beranda, jadi bisa langsung diulang lewat kartu belajar.
        </Text>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  gameScreen: { paddingHorizontal: 0, paddingBottom: 0 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#2b1c46",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  emojiBox: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  emoji: { fontSize: 30 },
  body: { flex: 1, gap: 2 },
  best: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  arrow: { fontSize: 12, color: colors.muted },
  tipCard: { gap: 6, backgroundColor: "#fff9f0", borderColor: "#ffe1bd" }
})
