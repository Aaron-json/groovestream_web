import type { Audiofile } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import {
  createListeningHistoryAudiofileSource,
  createMostPlayedAudiofileSource,
  flattenInfiniteData,
  listeningHistoryOptions,
  mostPlayedOptions,
} from "@groovestream/query/media";
import { userOptions } from "@groovestream/query/user";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { EmptyState, PaginationFooter } from "@/components/screen-state";
import { SectionHeading } from "@/components/section-heading";
import { useAuth } from "@/features/auth/auth-provider";
import { PLAYER_CONTENT_INSET } from "@/features/media/mini-player";
import {
  audiofileArtist,
  audiofileTitle,
  TrackRow,
} from "@/features/media/track-row";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";

export { RouteErrorState as ErrorBoundary } from "@/components/route-state";

function QuickAccessTile({
  audiofile,
  active,
  playing,
  onPress,
}: {
  audiofile: Audiofile;
  active: boolean;
  playing: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${active && playing ? "Pause" : "Play"} ${audiofileTitle(audiofile)} by ${audiofileArtist(audiofile)}`}
      accessibilityState={{ selected: active }}
      className={`h-14 flex-1 min-w-[46%] max-w-[50%] flex-row items-center overflow-hidden rounded-xl border ${
        active
          ? "border-primary/50 bg-secondary/80"
          : "border-border/80 bg-card active:bg-secondary/70"
      }`}
    >
      {/* Square Thumbnail */}
      <View className="h-14 w-14 shrink-0 items-center justify-center bg-secondary">
        <AppIcon
          name="musical-notes"
          size={20}
          colorClassName={active ? "accent-primary" : "accent-muted-foreground"}
        />
      </View>

      {/* Info */}
      <View className="min-w-0 flex-1 px-2.5 justify-center gap-0.5">
        <Text
          numberOfLines={1}
          className={`text-xs font-semibold tracking-tight ${
            active ? "text-primary" : "text-card-foreground"
          }`}
        >
          {audiofileTitle(audiofile)}
        </Text>
        <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
          {audiofileArtist(audiofile)}
        </Text>
      </View>

      {/* Playing state indicator */}
      {active ? (
        <View className="pr-2.5">
          <AppIcon
            name={playing ? "volume-high" : "pause"}
            size={14}
            colorClassName="accent-primary"
          />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function HomeScreen() {
  const toast = useAppToast();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const currentId = usePlaybackStore(
    (state) => state.playerState.currentMedia?.audiofile.id,
  );
  const playing = usePlaybackStore(
    (state) => state.playerState.status === "playing",
  );
  const user = useQuery({
    ...userOptions(session?.user.id ?? ""),
    enabled: Boolean(session),
  });
  const mostPlayed = useQuery(mostPlayedOptions());
  const history = useSuspenseInfiniteQuery(listeningHistoryOptions());
  const mostPlayedSource = useMemo(
    () => createMostPlayedAudiofileSource(queryClient),
    [],
  );
  const historySource = useMemo(
    () => createListeningHistoryAudiofileSource(queryClient),
    [],
  );
  const historyItems = flattenInfiniteData(history.data, (page) => page.data ?? []);
  const quickAccessItems = mostPlayed.data?.slice(0, 6) ?? [];

  const playFeatured = async (audiofile: Audiofile) => {
    try {
      const { playPauseToggle, setMedia } = usePlaybackStore.getState();
      if (currentId === audiofile.id) {
        await playPauseToggle();
        return;
      }
      const files = mostPlayedSource.getAudiofiles();
      const index = files.findIndex(({ id }) => id === audiofile.id);
      await setMedia(mostPlayedSource, index === -1 ? 0 : index);
    } catch (error) {
      toast.error(
        "Couldn't play this track",
        getErrorMessage(error, "The track could not be prepared"),
      );
    }
  };

  const refresh = () => Promise.all([mostPlayed.refetch(), history.refetch()]);

  const greeting = user.data?.username
    ? `Welcome, ${user.data.username}!`
    : "Welcome!";

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 4 }}>
      <FlashList
        data={historyItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackRow audiofile={item} source={historySource} />
        )}
        contentContainerStyle={{ paddingBottom: PLAYER_CONTENT_INSET + 24 }}
        refreshing={mostPlayed.isRefetching || history.isRefetching}
        onRefresh={() => void refresh()}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (history.hasNextPage && !history.isFetchingNextPage) {
            void history.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className="gap-5 pb-3 pt-2">
            {/* Header */}
            <View className="px-4">
              <Text className="text-xl font-bold tracking-tight text-foreground">
                {greeting}
              </Text>
            </View>

            {/* Quick-Access 2-Column Grid (Top Most Played) */}
            {mostPlayed.isLoading ? (
              <View className="py-4">
                <ActivityIndicator colorClassName="accent-primary" />
              </View>
            ) : quickAccessItems.length > 0 ? (
              <View className="gap-2.5">
                <View className="px-4">
                  <SectionHeading title="Jump Back In" />
                </View>
                <View className="flex-row flex-wrap gap-2.5 px-4">
                  {quickAccessItems.map((item) => (
                    <QuickAccessTile
                      key={item.id}
                      audiofile={item}
                      active={currentId === item.id}
                      playing={playing}
                      onPress={() => void playFeatured(item)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Listening History Header */}
            <View className="px-4 pt-1">
              <SectionHeading title="Listening History" />
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Nothing played yet"
            description="Start exploring and listening to music. Your listening history will appear here."
            icon="time-outline"
          />
        }
        ListFooterComponent={
          <PaginationFooter
            loading={history.isFetchingNextPage}
            failed={history.isFetchNextPageError}
            onRetry={() => void history.fetchNextPage()}
          />
        }
      />
    </View>
  );
}
