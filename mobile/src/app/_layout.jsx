import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { KidsProvider } from "../lib/progress"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KidsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f4f8ff" } }} />
      </KidsProvider>
    </SafeAreaProvider>
  )
}
