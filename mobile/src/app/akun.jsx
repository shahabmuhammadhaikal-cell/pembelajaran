import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { Button, Card, Screen, SectionTitle } from "../components/ui"
import { useAccount } from "../lib/account"
import { colors, radius, text } from "../lib/theme"

const STATUS_LABEL = {
  idle: "Belum tersinkron",
  syncing: "Menyinkronkan…",
  synced: "Tersimpan di Firestore",
  offline: "Mode luring — progres menunggu koneksi"
}

function timeLabel(value) {
  if (!value) return ""
  try {
    return new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

export default function AccountScreen() {
  const router = useRouter()
  const {
    session,
    busy,
    error,
    status,
    lastSync,
    googleReady,
    login,
    register,
    loginWithGoogle,
    resetPassword,
    logout
  } = useAccount()
  const [email, setEmail] = useState(session ? session.email : "")
  const [password, setPassword] = useState("")
  const [notice, setNotice] = useState("")

  const submit = async mode => {
    setNotice("")
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setNotice("Isi email dulu ya.")
      return
    }
    if (mode === "reset") {
      const ok = await resetPassword(cleanEmail)
      if (ok) setNotice("Tautan atur ulang password sudah dikirim ke email itu.")
      return
    }
    if (password.trim().length < 6) {
      setNotice("Password minimal 6 karakter.")
      return
    }
    const ok = mode === "register" ? await register(cleanEmail, password) : await login(cleanEmail, password)
    if (ok) {
      setNotice(mode === "register" ? "Akun dibuat dan progres tersimpan." : "Berhasil masuk.")
      setPassword("")
      router.back()
    }
  }

  const confirmLogout = async () => {
    await logout()
    setNotice("Sudah keluar. Progres di perangkat ini tetap tersimpan.")
    setPassword("")
  }

  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back}>
        <Text style={styles.backText}>← Kembali</Text>
      </Pressable>

      <SectionTitle
        emoji="🔐"
        title={session ? "Akun tersambung" : "Masuk akun"}
        subtitle="Firebase Authentication · Firestore"
      />

      {session ? (
        <>
          <Card style={styles.stack}>
            <Text style={text.label}>Email akun</Text>
            <Text style={styles.email}>{session.email}</Text>
            <Text style={text.muted}>{STATUS_LABEL[status] || STATUS_LABEL.idle}</Text>
            {lastSync ? (
              <Text style={text.muted}>Sinkron terakhir {timeLabel(lastSync)}</Text>
            ) : null}
          </Card>

          <Card style={styles.stack}>
            <Text style={text.h3}>Progres ikut akun ini</Text>
            <Text style={text.muted}>
              Bintang, kata dikuasai, topik, stiker, dan cerita tersimpan ke akun Firebase yang sama
              dengan versi web, jadi bisa dibuka lagi di perangkat lain.
            </Text>
          </Card>

          <Button label="Keluar dari akun" variant="ghost" onPress={confirmLogout} disabled={busy} />
        </>
      ) : (
        <>
          <Card style={styles.stack}>
            <Text style={text.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              placeholderTextColor="#a79bbb"
              accessibilityLabel="Email akun"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={text.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="minimal 6 karakter"
              placeholderTextColor="#a79bbb"
              accessibilityLabel="Password akun"
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
            />
            <Button
              label={busy ? "Memproses…" : "Masuk"}
              onPress={() => submit("login")}
              disabled={busy}
            />
            <View style={styles.row}>
              <Button
                label="Buat akun baru"
                variant="ghost"
                size="sm"
                onPress={() => submit("register")}
                disabled={busy}
                style={styles.grow}
              />
              <Button
                label="Lupa password"
                variant="ghost"
                size="sm"
                onPress={() => submit("reset")}
                disabled={busy}
                style={styles.grow}
              />
            </View>
          </Card>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <Card style={styles.stack}>
            <Button
              label={busy ? "Menghubungkan…" : "Lanjutkan dengan Google"}
              variant="ghost"
              onPress={() => loginWithGoogle()}
              disabled={busy}
            />
            <Text style={[text.muted, styles.googleNote]}>
              {googleReady
                ? "Memakai akun Google yang sama dengan login web (Firebase Authentication)."
                : "Masuk Google di APK perlu client ID Android/iOS dari Google Cloud Console. Untuk sekarang pakai email dan password."}
            </Text>
          </Card>

          <Text style={[text.muted, styles.note]}>
            Pakai akun Firebase yang sama seperti aplikasi web. Tanpa akun pun aplikasi tetap jalan
            dengan progres tersimpan di perangkat.
          </Text>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", paddingVertical: 6 },
  backText: { fontSize: 13, fontWeight: "800", color: colors.blue },
  stack: { gap: 8 },
  email: { ...text.h3, fontSize: 15 },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.ink
  },
  row: { flexDirection: "row", gap: 8 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 2, backgroundColor: colors.line, borderRadius: 2 },
  dividerText: { fontSize: 11, fontWeight: "800", color: colors.muted, textTransform: "uppercase" },
  googleNote: { textAlign: "center" },
  grow: { flex: 1 },
  note: { textAlign: "center" },
  error: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b93b5b",
    backgroundColor: "#fff2f5",
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "#ffc7d5",
    padding: 12
  },
  notice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f8a5f",
    backgroundColor: colors.softGreen,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "#b9eed4",
    padding: 12
  }
})
