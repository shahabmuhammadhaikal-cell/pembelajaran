import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, radius, shadow, text } from "../lib/theme"

export function Screen({ children, scroll = true, contentStyle, edges = ["top", "bottom"] }) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  )
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {body}
    </SafeAreaView>
  )
}

export function Card({ children, style, tone = colors.card }) {
  return <View style={[styles.card, { backgroundColor: tone }, style]}>{children}</View>
}

export function SectionTitle({ emoji, title, subtitle, right }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>
        {emoji ? `${emoji} ` : ""}
        {title}
      </Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      {right}
    </View>
  )
}

export function ProgressBar({ percent = 0, color = colors.blue, height = 10, track = "#ece6f8" }) {
  const width = `${Math.max(0, Math.min(100, percent))}%`
  return (
    <View style={[styles.track, { height, borderRadius: height, backgroundColor: track }]}>
      <View style={{ width, height, borderRadius: height, backgroundColor: color }} />
    </View>
  )
}

export function Chip({ label, active, onPress, tone = colors.blue, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.chip,
        active && { backgroundColor: colors.softBlue, borderColor: tone },
        pressed && { opacity: 0.75 }
      ]}
    >
      <Text style={[styles.chipText, active && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  )
}

export function Button({ label, onPress, variant = "primary", size = "md", disabled, style }) {
  const primary = variant === "primary"
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        size === "sm" && styles.buttonSm,
        disabled && { opacity: 0.4 },
        pressed && !disabled && { transform: [{ translateY: 2 }] },
        style
      ]}
    >
      <Text style={[styles.buttonText, primary ? styles.buttonTextPrimary : styles.buttonTextGhost]}>
        {label}
      </Text>
    </Pressable>
  )
}

export function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 14 },
  card: {
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 2,
    borderColor: "#fff",
    ...shadow
  },
  sectionHead: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  sectionTitle: { ...text.h2 },
  sectionSub: { ...text.muted },
  track: { overflow: "hidden", width: "100%" },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff"
  },
  chipText: { fontSize: 13, fontWeight: "800", color: colors.muted },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "transparent"
  },
  buttonPrimary: { backgroundColor: colors.orange },
  buttonGhost: { backgroundColor: "#fff", borderColor: colors.line },
  buttonSm: { minHeight: 42, paddingHorizontal: 14 },
  buttonText: { fontSize: 15, fontWeight: "800" },
  buttonTextPrimary: { color: "#fff" },
  buttonTextGhost: { color: colors.ink },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.line
  },
  statValue: { fontSize: 16, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, textAlign: "center" }
})
