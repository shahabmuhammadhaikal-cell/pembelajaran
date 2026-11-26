import { useMemo } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { Button, Card, Chip, ProgressBar, Screen, SectionTitle } from "../../components/ui"
import {
  STICKERS,
  TOPICS,
  TOTAL_WORDS,
  levelProgress,
  topicGroups
} from "../../lib/data"
import { useKids } from "../../lib/progress"
import { useAccount } from "../../lib/account"
import { colors, radius, text } from "../../lib/theme"

const LANGUAGES = [
  { id: "id", label: "🇮🇩 Indonesia" },
  { id: "en", label: "🇬🇧 Inggris" },
  { id: "ar", label: "🕌 Arab" }
]

const LENGTHS = [
  { id: "short", label: "🐣 Pendek" },
  { id: "normal", label: "🦊 Sedang" },
  { id: "long", label: "🦅 Panjang" }
]

const ACCOUNT_STATUS = {
  idle: "Belum tersinkron",
  syncing: "Menyinkronkan…",
  synced: "Tersimpan di Firestore",
  offline: "Mode luring — progres menunggu koneksi"
}

const BEST_LABEL = {
  guess: "Tebak Kata",
  listen: "Dengar & Pilih",
  sentence: "Susun Kalimat",
  letter: "Huruf Awal"
}

export default function ProgressTab() {
  const router = useRouter()
  const { kids, actions } = useKids()
  const { session, status, lastSync } = useAccount()
  const level = levelProgress(kids.stars)
  const mastered = useMemo(
    () => TOPICS.reduce((sum, topic) => sum + topic.items.filter(item => kids.learned[item.key]).length, 0),
    [kids.learned]
  )
  const groups = useMemo(
    () =>
      topicGroups().map(group => {
        const total = group.topics.reduce((sum, topic) => sum + topic.items.length, 0)
        const learned = group.topics.reduce(
          (sum, topic) => sum + topic.items.filter(item => kids.learned[item.key]).length,
          0
        )
        return { ...group, total, learned, percent: total ? Math.round((learned / total) * 100) : 0 }
      }),
    [kids.learned]
  )

  const confirmReset = () => {
    Alert.alert("Ulangi progres?", "Semua bintang, topik, stiker, dan kata sulit akan dihapus.", [
      { text: "Batal", style: "cancel" },
      { text: "Ya, hapus", style: "destructive", onPress: () => actions.reset() }
    ])
  }

  return (
    <Screen>
      <SectionTitle emoji="📊" title="Laporan belajar" subtitle="ringkasan untuk orang tua" />

      <Card style={styles.accountCard}>
        <View style={styles.flex}>
          <Text style={text.h3}>{session ? `🔐 ${session.email}` : "🔐 Belum masuk akun"}</Text>
          <Text style={text.muted}>
            {session
              ? ACCOUNT_STATUS[status] || ACCOUNT_STATUS.idle
              : "Masuk dengan akun Firebase yang sama seperti versi web supaya progres tersimpan di Firestore."}
          </Text>
          {session && lastSync ? (
            <Text style={text.muted}>
              Sinkron terakhir{" "}
              {new Date(lastSync).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          ) : null}
        </View>
        <Button
          label={session ? "Kelola" : "Masuk"}
          size="sm"
          onPress={() => router.push("/akun")}
        />
      </Card>

      <Card style={styles.levelCard}>
        <Text style={styles.levelAvatar}>{level.current.avatar}</Text>
        <View style={styles.flex}>
          <Text style={text.h3}>
            Level {level.current.level} · {level.current.title}
          </Text>
          <ProgressBar percent={level.percent} color={colors.purple} />
        </View>
        <Text style={styles.stars}>⭐ {kids.stars}</Text>
      </Card>

      <View style={styles.gridStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {mastered}/{TOTAL_WORDS}
          </Text>
          <Text style={styles.statLabel}>kata dikuasai</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {Object.keys(kids.topicsDone).length}/{TOPICS.length}
          </Text>
          <Text style={styles.statLabel}>topik selesai</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Object.keys(kids.stickers).length}/{STICKERS.length}</Text>
          <Text style={styles.statLabel}>stiker terbuka</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Object.keys(kids.stories).length}</Text>
          <Text style={styles.statLabel}>cerita dibaca</Text>
        </View>
      </View>

      <SectionTitle emoji="🗂️" title="Progres per kelompok" />
      <Card style={styles.groupCard}>
        {groups.map(group => (
          <View key={group.id} style={styles.groupRow}>
            <View style={styles.groupHead}>
              <Text style={styles.groupTitle}>
                {group.emoji} {group.title}
              </Text>
              <Text style={styles.groupMeta}>
                {group.learned}/{group.total}
              </Text>
            </View>
            <ProgressBar percent={group.percent} color={colors.pink} height={8} />
          </View>
        ))}
      </Card>

      <SectionTitle emoji="🏅" title="Rekor permainan" />
      <Card style={styles.bestCard}>
        {Object.entries(BEST_LABEL).map(([id, label]) => (
          <View key={id} style={styles.bestRow}>
            <Text style={styles.bestName}>{label}</Text>
            <Text style={styles.bestValue}>{kids.best[id] ? `rekor ${kids.best[id]}` : "belum dicoba"}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle emoji="🎖️" title="Album stiker" subtitle={`${Object.keys(kids.stickers).length} dari ${STICKERS.length}`} />
      <View style={styles.stickers}>
        {STICKERS.map(sticker => {
          const unlocked = Boolean(kids.stickers[sticker.id])
          return (
            <View key={sticker.id} style={[styles.sticker, unlocked && styles.stickerOn]}>
              <Text style={styles.stickerEmoji}>{unlocked ? sticker.emoji : "🔒"}</Text>
              <Text style={styles.stickerName} numberOfLines={2}>
                {unlocked ? sticker.name : sticker.hint}
              </Text>
            </View>
          )
        })}
      </View>

      <SectionTitle emoji="⚙️" title="Pengaturan" />
      <Card style={styles.settings}>
        <Text style={text.label}>Bahasa kata</Text>
        <View style={styles.chips}>
          {LANGUAGES.map(item => (
            <Chip
              key={item.id}
              label={item.label}
              active={kids.settings.lang === item.id}
              onPress={() => actions.setSetting("lang", item.id)}
            />
          ))}
        </View>

        <Text style={text.label}>Panjang permainan</Text>
        <View style={styles.chips}>
          {LENGTHS.map(item => (
            <Chip
              key={item.id}
              label={item.label}
              active={kids.settings.length === item.id}
              onPress={() => actions.setSetting("length", item.id)}
            />
          ))}
        </View>

        <View style={styles.chips}>
          <Chip
            label={kids.settings.sound === false ? "🔇 Suara mati" : "🔊 Suara nyala"}
            active={kids.settings.sound !== false}
            onPress={() => actions.setSetting("sound", kids.settings.sound === false)}
          />
          <Chip
            label="🐢 Suara pelan"
            active={kids.settings.slow === true}
            onPress={() => actions.setSetting("slow", kids.settings.slow !== true)}
          />
        </View>
      </Card>

      <Pressable
        onPress={confirmReset}
        accessibilityRole="button"
        accessibilityLabel="Ulangi progres anak"
        style={styles.reset}
      >
        <Text style={styles.resetText}>🔄 Ulangi progres</Text>
      </Pressable>

      <Text style={[text.muted, styles.note]}>
        Progres tersimpan otomatis di perangkat. Menyambungkan akun membuat progres juga tersimpan di
        Firestore. Tidak ada iklan.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  levelCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountCard: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelAvatar: { fontSize: 34 },
  flex: { flex: 1, gap: 6 },
  stars: { fontWeight: "800", color: colors.ink },
  gridStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.line
  },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
  groupCard: { gap: 10 },
  groupRow: { gap: 4 },
  groupHead: { flexDirection: "row", justifyContent: "space-between" },
  groupTitle: { fontSize: 12.5, fontWeight: "800", color: colors.ink },
  groupMeta: { fontSize: 11, fontWeight: "800", color: colors.muted },
  bestCard: { gap: 8 },
  bestRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  bestName: { fontSize: 13, fontWeight: "700", color: colors.ink },
  bestValue: { fontSize: 11.5, fontWeight: "800", color: colors.muted },
  stickers: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sticker: {
    width: 96,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff"
  },
  stickerOn: { backgroundColor: "#fffaf0", borderColor: "#ffe1a1" },
  stickerEmoji: { fontSize: 30 },
  stickerName: { fontSize: 10, textAlign: "center", color: colors.muted, fontWeight: "700" },
  settings: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reset: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: "#fff2f5",
    borderWidth: 2,
    borderColor: "#ffc7d5"
  },
  resetText: { fontSize: 13, fontWeight: "800", color: "#b93b5b" },
  note: { textAlign: "center" }
})
