import type { Playlist } from "@groovestream/api/models";
import {
  flattenInfiniteData,
  playlistInvitesOptions,
  playlistsListOptions,
} from "@groovestream/query/media";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { type Href, router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { EmptyState, PaginationFooter } from "@/components/screen-state";
import { SectionHeading } from "@/components/section-heading";
import { useAuth } from "@/features/auth/auth-provider";
import { PLAYER_CONTENT_INSET } from "@/features/media/mini-player";
import { CreatePlaylistSheet } from "@/features/playlists/create-playlist-sheet";
import { PlaylistInvites } from "@/features/playlists/invites";

export { RouteErrorState as ErrorBoundary } from "@/components/route-state";

function PlaylistRow({
  playlist,
  isOwner,
}: {
  playlist: Playlist;
  isOwner: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/library/${playlist.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${playlist.name}, by ${playlist.owner_username}`}
      className="mx-4 my-1 flex-row items-center gap-3 rounded-xl border border-border/80 bg-card p-3 active:bg-secondary/60"
    >
      <View className="h-11 w-11 items-center justify-center rounded-lg bg-secondary">
        <AppIcon name="list" size={20} colorClassName="accent-muted-foreground" />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-semibold text-card-foreground tracking-tight text-sm">
          {playlist.name}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {isOwner ? "Created by you" : `By @${playlist.owner_username}`}
        </Text>
      </View>
      <AppIcon name="chevron-forward" size={16} colorClassName="accent-muted-foreground" />
    </Pressable>
  );
}

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const invites = useInfiniteQuery(playlistInvitesOptions());
  const playlists = useSuspenseInfiniteQuery(playlistsListOptions());
  const playlistItems = flattenInfiniteData(playlists.data, (page) => page.data ?? []);
  const inviteItems = invites.data
    ? flattenInfiniteData(invites.data, (page) => page.data ?? [])
    : [];

  const refresh = () => Promise.all([playlists.refetch(), invites.refetch()]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 4 }}>
      <FlashList
        data={playlistItems}
        keyExtractor={(playlist) => playlist.id}
        renderItem={({ item }) => (
          <PlaylistRow
            playlist={item}
            isOwner={item.owner_id === session?.user.id}
          />
        )}
        contentContainerStyle={{ paddingBottom: PLAYER_CONTENT_INSET + 24 }}
        refreshing={playlists.isRefetching || invites.isRefetching}
        onRefresh={() => void refresh()}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (playlists.hasNextPage && !playlists.isFetchingNextPage) {
            void playlists.fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className="gap-5 px-4 pb-3 pt-2">
            {/* Header with Title + Create Button */}
            <View className="flex-row items-center justify-between">
              <View className="gap-0.5">
                <Text className="text-xl font-bold tracking-tight text-foreground">
                  Library
                </Text>
              </View>
              <CreatePlaylistSheet />
            </View>

            {/* Pending Invites */}
            {invites.isLoading ? (
              <View className="py-2">
                <ActivityIndicator colorClassName="accent-primary" />
              </View>
            ) : invites.isError && !invites.data ? (
              <Text className="text-xs text-destructive">
                Invitations could not be loaded. Pull down to retry.
              </Text>
            ) : (
              <PlaylistInvites
                invites={inviteItems}
                hasMore={Boolean(invites.hasNextPage)}
                loadingMore={invites.isFetchingNextPage}
                loadMoreFailed={invites.isFetchNextPageError}
                onLoadMore={() => void invites.fetchNextPage()}
              />
            )}

            {playlistItems.length > 0 ? (
              <SectionHeading title="Playlists" />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No playlists yet"
            description="Create a playlist or accept an invitation to get started."
            icon="library-outline"
            action={<CreatePlaylistSheet />}
          />
        }
        ListFooterComponent={
          <PaginationFooter
            loading={playlists.isFetchingNextPage}
            failed={playlists.isFetchNextPageError}
            onRetry={() => void playlists.fetchNextPage()}
          />
        }
      />
    </View>
  );
}
