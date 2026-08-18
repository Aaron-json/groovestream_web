import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { RouteLoadingState } from "@/components/route-state";
import { MiniPlayer } from "@/features/media/mini-player";
import { useNavigationColors } from "@/lib/theme";

export const SuspenseFallback = RouteLoadingState;

export default function TabsLayout() {
  const colors = useNavigationColors();

  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: 52,
            paddingTop: 4,
            paddingBottom: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontWeight: "600",
            fontSize: 17,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "library" : "library-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
