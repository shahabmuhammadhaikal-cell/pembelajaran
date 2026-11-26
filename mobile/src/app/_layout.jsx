import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { KidsProvider } from "../lib/progress"
import { AccountProvider } from "../lib/account"

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KidsProvider>
        <AccountProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f4f8ff" } }} />
        </AccountProvider>
      </KidsProvider>
    </SafeAreaProvider>
  )
}
