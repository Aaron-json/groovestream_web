import { Stack } from "expo-router";
import { RouteLoadingState } from "@/components/route-state";
import { useNavigationColors } from "@/lib/theme";

export const SuspenseFallback = RouteLoadingState;

export default function LibraryLayout() {
  const colors = useNavigationColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Library" }} />
      <Stack.Screen name="[playlistId]" options={{ title: "Playlist" }} />
    </Stack>
  );
}
