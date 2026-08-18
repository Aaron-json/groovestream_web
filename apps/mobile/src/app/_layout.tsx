import "../../global.css";
import { userOptions } from "@groovestream/query/user";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { ErrorState, LoadingState } from "@/components/screen-state";
import { useAuth } from "@/features/auth/auth-provider";
import { AppProviders } from "@/providers/app-providers";
import { useNavigationColors } from "@/lib/theme";

function RootNavigator() {
  const colorScheme = useColorScheme();
  const colors = useNavigationColors();
  const { session, initialized } = useAuth();
  const userQuery = useQuery({
    ...userOptions(session?.user.id ?? ""),
    enabled: Boolean(session),
  });

  if (!initialized || (session && userQuery.isLoading)) {
    return <LoadingState label="Opening your library" />;
  }

  if (session && userQuery.isError && userQuery.data === undefined) {
    return (
      <ErrorState
        message="Groovestream could not load your profile."
        onRetry={() => void userQuery.refetch()}
      />
    );
  }

  const signedIn = Boolean(session && userQuery.data);
  const needsProfile = Boolean(session && userQuery.data === null);
  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={needsProfile}>
          <Stack.Screen
            name="complete-profile"
            options={{ headerShown: false }}
          />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="now-playing"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
