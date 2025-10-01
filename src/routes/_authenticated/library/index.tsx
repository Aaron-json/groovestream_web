import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  acceptPlaylistInvite,
  getPlaylistInvites,
  getUserPlaylists,
  rejectPlaylistInvite,
} from "@/api/requests/media";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import InfoCard from "@/components/custom/info-card";
import CreatePlaylistModal from "@/components/custom/create-playlist";
import InviteList from "@/components/custom/invite-list";
import { PlaylistInvite } from "@/api/types/invites";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Music2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/library/")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    data: playlists,
    error: playlistsErr,
    isLoading: playlistsLoading,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getUserPlaylists(),
  });

  const {
    data: playlistInvites,
    error: playlistInvitesErr,
    isLoading: playlistInvitesLoading,
    refetch: refetchPlaylistInvites,
  } = useQuery({
    queryKey: ["playlistInvites"],
    queryFn: () => getPlaylistInvites(10),
  });

  const handleAcceptInvite = useCallback(
    async (invite: PlaylistInvite) => {
      try {
        await acceptPlaylistInvite(invite.from_id, invite.playlist_id);
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
        await rejectPlaylistInvite(invite.from_id, invite.playlist_id);
        toast.success("Invite declined");
        refetchPlaylistInvites();
      } catch (error) {
        toast.error("Failed to decline invite");
      }
    },
    [refetchPlaylistInvites],
  );

  // Show single error if both fail
  if (playlistInvitesErr && playlistsErr) {
    return (
      <section className="space-y-6">
        <PageHeader />
        <InfoCard text="Unable to load your library. Please try again later." />
      </section>
    );
  }

  const hasPlaylists = playlists && playlists.length > 0;
  const hasInvites = playlistInvites && playlistInvites.length > 0;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader />

      {/* Invites Section */}
      {!playlistInvitesLoading && hasInvites && (
        <InviteList
          invites={playlistInvites}
          title="Playlist Invites"
          refetch={refetchPlaylistInvites}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      )}

      {/* Playlists Section */}
      <div className="flex justify-center">
        {playlistsLoading ? (
          <MediaListSkeleton />
        ) : playlistsErr ? (
          <InfoCard text="Unable to load playlists" />
        ) : hasPlaylists ? (
          <MediaList media={playlists} title="Your Playlists" />
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
    <div className="border-2 border-dashed rounded-lg p-12 text-center w-full max-w-2xl">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Music2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first playlist or accept an invite from friends
      </p>
      <CreatePlaylistModal
        trigger={
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Playlist
          </Button>
        }
      />
    </div>
  );
}
