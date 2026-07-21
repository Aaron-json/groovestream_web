import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  acceptPlaylistInvite,
  rejectPlaylistInvite,
  PlaylistInvite,
} from "@/api/requests/media";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import InfoCard from "@/components/custom/info-card";
import CreatePlaylistModal from "@/components/custom/create-playlist";
import InviteList, {
  InviteListSkeleton,
} from "@/components/custom/invite-list";
import { InfiniteList } from "@/components/custom/infinite-list";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Music2 } from "lucide-react";
import {
  flattenInfiniteData,
  playlistsListOptions,
  playlistInvitesOptions,
} from "@/query/media";

import { queryClient } from "@/lib/query";
import {
  PLAYLISTS_LIST_KEY,
  removePlaylistInviteFromCache,
} from "@/query/media";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const Route = createFileRoute("/_authenticated/library/")({
  component: RouteComponent,
  loader: async () => {
    await Promise.all([
      queryClient.prefetchInfiniteQuery(playlistsListOptions()),
      queryClient.prefetchInfiniteQuery(playlistInvitesOptions()),
    ]);
  },
  pendingMs: 200,
  pendingComponent: () => (
    <section className="flex flex-col gap-6">
      <PageHeader />
      <div className="flex justify-center">
        <MediaListSkeleton />
      </div>
    </section>
  ),
  errorComponent: () => (
    <section className="space-y-6">
      <PageHeader />
      <InfoCard
        variant="destructive"
        title="Error"
        text="Unable to load your library. Please try again later."
      />
    </section>
  ),
  staticData: {
    crumbs: () => [{ label: "Library", to: "/library" }],
  },
});

function RouteComponent() {
  const {
    data: playlistsData,
    fetchNextPage: fetchPlaylists,
    hasNextPage: hasNextPlaylists,
    isFetchingNextPage: isFetchingPlaylists,
    isFetchNextPageError: isPlaylistsNextPageError,
  } = useSuspenseInfiniteQuery(playlistsListOptions());

  const {
    data: playlistInvitesData,
    fetchNextPage: fetchInvites,
    hasNextPage: hasNextInvites,
    isFetchingNextPage: isFetchingInvites,
    isFetchNextPageError: isInvitesNextPageError,
  } = useSuspenseInfiniteQuery(playlistInvitesOptions());

  const handleAcceptInvite = useCallback(async (invite: PlaylistInvite) => {
    try {
      await acceptPlaylistInvite({
        playlist_id: invite.playlist_id,
        playlist_invite_sender_id: invite.from_id,
      });
      removePlaylistInviteFromCache(invite);
      void queryClient.invalidateQueries({ queryKey: PLAYLISTS_LIST_KEY });
      toast.success("Invite accepted");
    } catch {
      toast.error("Failed to accept invite");
    }
  }, []);

  const handleDeclineInvite = useCallback(async (invite: PlaylistInvite) => {
    try {
      await rejectPlaylistInvite({
        playlist_id: invite.playlist_id,
        playlist_invite_sender_id: invite.from_id,
      });
      removePlaylistInviteFromCache(invite);
      toast.success("Invite declined");
    } catch {
      toast.error("Failed to decline invite");
    }
  }, []);

  const playlistsList = flattenInfiniteData(
    playlistsData,
    (page) => page.data ?? [],
  );
  const invitesList = flattenInfiniteData(
    playlistInvitesData,
    (page) => page.data ?? [],
  );

  const hasPlaylists = playlistsList.length > 0;
  const hasInvites = invitesList.length > 0;
  const invitesPagination = {
    loadMore: fetchInvites,
    hasMore: hasNextInvites ?? false,
    isLoading: isFetchingInvites,
    isError: isInvitesNextPageError,
  };
  const playlistsPagination = {
    loadMore: fetchPlaylists,
    hasMore: hasNextPlaylists ?? false,
    isLoading: isFetchingPlaylists,
    isError: isPlaylistsNextPageError,
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader />

      {(hasInvites || hasNextInvites) && (
        <InfiniteList
          pagination={invitesPagination}
          loadingFallback={<InviteListSkeleton />}
        >
          <InviteList
            invites={invitesList}
            title="Playlist Invites"
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
          />
        </InfiniteList>
      )}

      <div className="flex justify-center">
        {hasPlaylists || hasNextPlaylists ? (
          <InfiniteList
            pagination={playlistsPagination}
            loadingFallback={<MediaListSkeleton />}
          >
            <MediaList media={playlistsList} title="Your Playlists" />
          </InfiniteList>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-muted-foreground mt-1">
          Manage your playlists and invites
        </p>
      </div>

      <CreatePlaylistModal
        trigger={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        }
      />
    </div>
  );
}

function EmptyState() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Music2 />
        </EmptyMedia>
        <EmptyTitle>No playlists yet</EmptyTitle>
        <EmptyDescription>
          Create your own playlist or accept an invite from a friend.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreatePlaylistModal
          trigger={
            <Button variant="outline">
              <Plus data-icon="inline-start" />
              Create a playlist
            </Button>
          }
        />
      </EmptyContent>
    </Empty>
  );
}
