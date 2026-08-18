import type { Audiofile } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import {
  createPlaylistAudiofileSource,
  flattenInfiniteData,
  playlistAudiofilesOptions,
  playlistInfoOptions,
} from "@groovestream/query/media";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PaginationFooter } from "@/components/screen-state";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { PLAYER_CONTENT_INSET } from "@/features/media/mini-player";
import { TrackRow } from "@/features/media/track-row";
import { PlaylistActionsSheet } from "@/features/playlists/playlist-actions-sheet";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";

export { RouteErrorState as ErrorBoundary } from "@/components/route-state";

export default function PlaylistScreen() {
  const toast = useAppToast();
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const playlist = useQuery(playlistInfoOptions(playlistId));
  const tracks = useSuspenseInfiniteQuery(playlistAudiofilesOptions(playlistId));
  const current = usePlaybackStore(
    (state) => state.playerState.currentMedia?.audiofile,
  );
  const playing = usePlaybackStore(
    (state) => state.playerState.status === "playing",
  );
  const preparing = usePlaybackStore(
    (state) => state.playerState.status === "loading",
  );
  const source = useMemo(
    () => createPlaylistAudiofileSource(queryClient, playlistId),
    [playlistId],
  );
  const audiofiles = flattenInfiniteData(tracks.data, (page) => page.data ?? []);

  const play = async (audiofile: Audiofile) => {
    try {
      const { playPauseToggle, setMedia } = usePlaybackStore.getState();
      if (current?.playlist_id === playlistId) {
        await playPauseToggle();
        return;
      }
      const files = source.getAudiofiles();
      const index = files.findIndex(({ id }) => id === audiofile.id);
      await setMedia(source, index === -1 ? 0 : index);
    } catch (error) {
      toast.error(
        "Couldn't start this playlist",
        getErrorMessage(error, "The first track could not be prepared"),
      );
    }
  };

  const activeHere = current?.playlist_id === playlistId;

  return (
    <>
      <Stack.Screen
        options={{
          title: playlist.data?.name ?? "Playlist",
          headerBackTitle: "Library",
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: "600",
          },
        }}
      />
      <FlashList
        data={audiofiles}
        keyExtractor={(audiofile) => audiofile.id}
        renderItem={({ item, index }) => (
          <TrackRow
            audiofile={item}
            source={source}
            index={index}
            showArtwork
          />
        )}
        contentContainerStyle={{ paddingBottom: PLAYER_CONTENT_INSET + 24 }}
        refreshing={tracks.isRefetching || playlist.isRefetching}
        onRefresh={() => {
          void tracks.refetch();
          void playlist.refetch();
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (tracks.hasNextPage && !tracks.isFetchingNextPage) {
            void tracks.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className="gap-4 px-4 pb-4 pt-3">
            {/* Hero Section */}
            <View className="flex-row items-center gap-4">
              <View className="h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-secondary">
                <AppIcon name="musical-notes" size={32} colorClassName="accent-muted-foreground" />
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <Text numberOfLines={2} className="text-xl font-bold tracking-tight text-foreground">
                  {playlist.data?.name ?? "Playlist"}
                </Text>
                {playlist.isError && playlist.data === undefined ? (
                  <Text className="text-xs text-destructive">
                    Playlist details could not be loaded.
                  </Text>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Badge variant="secondary">
                      By @{playlist.data?.owner_username ?? "unknown"}
                    </Badge>
                  </View>
                )}
              </View>
              {playlist.data ? <PlaylistActionsSheet playlist={playlist.data} /> : null}
            </View>

            {/* Play Button */}
            {audiofiles[0] ? (
              <Button
                className="w-full"
                size="default"
                isDisabled={preparing}
                onPress={() => void play(audiofiles[0])}
              >
                {preparing ? (
                  <ButtonSpinner />
                ) : (
                  <AppIcon
                    name={activeHere && playing ? "pause" : "play"}
                    size={16}
                    colorClassName="accent-primary-foreground"
                  />
                )}
                <ButtonText>{activeHere && playing ? "Pause" : "Play"}</ButtonText>
              </Button>
            ) : null}

            {/* Tracks Header */}
            <View className="flex-row items-baseline justify-between pt-1">
              <Text className="text-base font-bold tracking-tight text-foreground">
                Tracks
              </Text>
              <Text className="text-xs text-muted-foreground">
                {audiofiles.length} loaded
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="This playlist is empty"
            description="Add tracks to this playlist from the web app and they will show up here instantly."
            icon="musical-notes-outline"
          />
        }
        ListFooterComponent={
          <PaginationFooter
            loading={tracks.isFetchingNextPage}
            failed={tracks.isFetchNextPageError}
            onRetry={() => void tracks.fetchNextPage()}
          />
        }
      />
    </>
  );
}
