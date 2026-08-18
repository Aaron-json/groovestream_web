import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ListMusic, Volume2 } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  flattenInfiniteData,
  playlistsListOptions,
} from "@groovestream/query/media";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { InfiniteList } from "./infinite-list";

export function SidebarPlaylists() {
  const { isMobile, setOpenMobile } = useSidebar();
  const currentlyPlayingPlaylistId = usePlaybackStore(
    (state) => state.playerState.currentMedia?.audiofile.playlist_id,
  );
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery(playlistsListOptions());

  const playlists = data
    ? flattenInfiniteData(data, (page) => page.data ?? [])
    : [];

  if (playlists.length === 0) return null;

  const pagination = {
    loadMore: fetchNextPage,
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
    isError: isFetchNextPageError,
  };

  function handlePlaylistSelect() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <SidebarGroup className="flex-1 min-h-0 overflow-hidden pt-4 pb-0">
      <SidebarGroupLabel className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-1 px-4">
        Your Playlists
      </SidebarGroupLabel>
      <SidebarGroupContent className="h-full flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          <InfiniteList pagination={pagination}>
            <SidebarMenu>
              {playlists.map((playlist) => {
                const isPlaying = playlist.id === currentlyPlayingPlaylistId;

                return (
                  <SidebarMenuItem key={playlist.id}>
                    <Link
                      to="/library/playlists/$playlistId"
                      params={{ playlistId: playlist.id }}
                      onClick={handlePlaylistSelect}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
                      activeProps={{
                        className:
                          "bg-muted text-foreground font-medium shadow-sm",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ListMusic className="size-4 shrink-0 opacity-70" />
                        <span className="truncate text-sm">
                          {playlist.name}
                        </span>
                      </div>
                      {isPlaying && (
                        <Volume2 className="size-4 shrink-0 text-primary opacity-80" />
                      )}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </InfiniteList>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
