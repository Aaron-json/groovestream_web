import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  acceptPlaylistInvite,
  rejectPlaylistInvite,
  PlaylistInvite,
} from "@/api/requests/media";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import InfoCard from "@/components/custom/info-card";
import CreatePlaylistModal from "@/components/custom/create-playlist";
import InviteList from "@/components/custom/invite-list";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Music2 } from "lucide-react";
import { playlistsListOptions, playlistInvitesOptions } from "@/hooks/media";

import { queryClient } from "@/lib/query";

export const Route = createFileRoute("/_authenticated/library/")({
  component: RouteComponent,
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(playlistsListOptions()),
      queryClient.ensureQueryData(playlistInvitesOptions(10)),
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
  const { data: playlists, refetch: refetchPlaylists } = useSuspenseQuery(
    playlistsListOptions(),
  );

  const { data: playlistInvites, refetch: refetchPlaylistInvites } =
    useSuspenseQuery(playlistInvitesOptions(10));

  const handleAcceptInvite = useCallback(
    async (invite: PlaylistInvite) => {
      try {
        await acceptPlaylistInvite({
          playlist_id: invite.playlist_id,
          playlist_invite_sender_id: invite.from_id,
        });
        toast.success("Invite accepted");
        refetchPlaylistInvites();
        refetchPlaylists();
      } catch (error) {
        toast.error("Failed to accept invite");
      }
    },
    [refetchPlaylistInvites, refetchPlaylists],
  );

  const handleDeclineInvite = useCallback(
    async (invite: PlaylistInvite) => {
      try {
        await rejectPlaylistInvite({
          playlist_id: invite.playlist_id,
          playlist_invite_sender_id: invite.from_id,
        });
        toast.success("Invite declined");
        refetchPlaylistInvites();
      } catch (error) {
        toast.error("Failed to decline invite");
      }
    },
    [refetchPlaylistInvites],
  );

  const playlistsList = playlists ?? [];
  const invitesList = playlistInvites ?? [];

  const hasPlaylists = playlistsList.length > 0;
  const hasInvites = invitesList.length > 0;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader />

      {hasInvites && (
        <InviteList
          invites={invitesList}
          title="Playlist Invites"
          refetch={refetchPlaylistInvites}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      <div className="flex justify-center">
        {hasPlaylists ? (
          <MediaList media={playlistsList} title="Your Playlists" />
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
    <div className="rounded-lg p-12 text-center w-full max-w-2xl">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Music2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your own playlist or accept an invite from friends
      </p>
      <CreatePlaylistModal
        trigger={
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create a playlist
          </Button>
        }
      />
    </div>
  );
}
