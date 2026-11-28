import { Tabs } from "expo-router"
import { Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors } from "../../lib/theme"

const icon = emoji => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
          backgroundColor: "#fff"
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda", tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="permainan" options={{ title: "Main", tabBarIcon: icon("🎮") }} />
      <Tabs.Screen name="cerita" options={{ title: "Cerita", tabBarIcon: icon("📖") }} />
      <Tabs.Screen name="progres" options={{ title: "Progres", tabBarIcon: icon("📊") }} />
    </Tabs>
  )
}
