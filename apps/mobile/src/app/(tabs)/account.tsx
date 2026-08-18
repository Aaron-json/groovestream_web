import { userOptions } from "@groovestream/query/user";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth-provider";
import { PLAYER_CONTENT_INSET } from "@/features/media/mini-player";
import { getErrorMessage } from "@/lib/errors";

export { RouteErrorState as ErrorBoundary } from "@/components/route-state";

function AccountContent({ session }: { session: Session }) {
  const { signOut } = useAuth();
  const toast = useAppToast();
  const insets = useSafeAreaInsets();
  const { data: user } = useSuspenseQuery(userOptions(session.user.id));

  const avatarUrl =
    session.user.user_metadata?.avatar_url ||
    session.user.user_metadata?.picture;

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "Playback and cached library data will be cleared.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut().catch((error) => {
            toast.error(
              "Couldn't sign out",
              getErrorMessage(error, "Please try again"),
            );
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: PLAYER_CONTENT_INSET + 32,
      }}
    >
      {/* Profile Header */}
      <View className="items-center px-6 pb-6 pt-4 gap-3">
        <Avatar
          size="xl"
          name={user?.username ?? session.user.email}
          imageUrl={avatarUrl}
        />
        <View className="items-center gap-0.5">
          <Text className="text-xl font-bold tracking-tight text-foreground" numberOfLines={1}>
            {user?.username ? `@${user.username}` : "Groovestream Listener"}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {session.user.email}
          </Text>
        </View>
      </View>

      <View className="gap-5 px-4">
        {/* Profile Details */}
        <View className="gap-1.5">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Profile Details
          </Text>
          <Card className="p-0 overflow-hidden divide-y divide-border/80">
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-sm font-medium text-muted-foreground">Username</Text>
              <Text className="text-sm font-semibold text-foreground">
                {user?.username ?? "-"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-sm font-medium text-muted-foreground">Email</Text>
              <Text className="text-sm font-semibold text-foreground">
                {session.user.email}
              </Text>
            </View>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-sm font-medium text-muted-foreground">Status</Text>
              <Text className="text-sm font-semibold text-emerald-400">
                Active
              </Text>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View className="gap-1.5">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Session
          </Text>
          <Card className="p-0 overflow-hidden">
            <Pressable
              onPress={confirmSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out of Groovestream"
              className="flex-row items-center gap-3 px-4 py-3 active:bg-secondary"
            >
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
                <AppIcon name="log-out-outline" size={16} colorClassName="accent-destructive" />
              </View>
              <Text className="flex-1 text-sm font-semibold text-destructive">
                Sign out
              </Text>
              <AppIcon
                name="chevron-forward"
                size={16}
                colorClassName="accent-muted-foreground"
              />
            </Pressable>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

export default function AccountScreen() {
  const { session } = useAuth();
  return session ? <AccountContent session={session} /> : null;
}
