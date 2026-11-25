import { Tabs } from "expo-router"
import { Text } from "react-native"
import { colors } from "../../lib/theme"

const icon = emoji => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800" },
        tabBarStyle: { height: 62, paddingTop: 6, paddingBottom: 6, backgroundColor: "#fff" }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda", tabBarIcon: icon("🏠") }} />
      <Tabs.Screen name="permainan" options={{ title: "Main", tabBarIcon: icon("🎮") }} />
      <Tabs.Screen name="cerita" options={{ title: "Cerita", tabBarIcon: icon("📖") }} />
      <Tabs.Screen name="progres" options={{ title: "Progres", tabBarIcon: icon("📊") }} />
    </Tabs>
  )
}
