import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { AudioLinesIcon, Logo } from "@/components/logo";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { getErrorMessage } from "@/lib/errors";
import { useNavigationColors } from "@/lib/theme";

export default function SignInScreen() {
  const { signInWithGoogle } = useAuth();
  const colors = useNavigationColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const signIn = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(getErrorMessage(cause, "Google sign-in could not be completed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 bg-background px-6 pb-6 pt-10 justify-between">
        {/* Top Header */}
        <View className="items-center pt-8">
          <Logo size="lg" />
        </View>

        {/* Center Hero */}
        <View className="items-center gap-4 px-2">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
            <AudioLinesIcon size={42} color="#ffffff" />
          </View>
          <Text className="text-center text-3xl font-extrabold tracking-tight text-foreground">
            Your music, wherever you are.
          </Text>
          <Text className="max-w-xs text-center text-sm leading-6 text-muted-foreground">
            Stream high-fidelity audio, build shared playlists, and sync your listening history anywhere.
          </Text>
        </View>

        {/* Bottom Actions */}
        <View className="gap-3">
          {error ? (
            <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5">
              <Text className="text-xs font-medium leading-5 text-destructive">{error}</Text>
            </View>
          ) : null}
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-xl"
            isDisabled={loading}
            onPress={() => void signIn()}
            accessibilityLabel="Continue with Google"
          >
            {loading ? (
              <ButtonSpinner />
            ) : (
              <AppIcon
                name="logo-google"
                size={18}
                colorClassName="accent-foreground"
              />
            )}
            <ButtonText>{loading ? "Signing in…" : "Continue with Google"}</ButtonText>
          </Button>
          <Text className="text-center text-[11px] leading-4 text-muted-foreground/70">
            By signing in, an account is created automatically for your email.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
