import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  acceptPlaylistInvite,
  getPlaylistInvites,
  getUserPlaylists,
  rejectPlaylistInvite,
} from "@/api/requests/media";
import MediaList from "@/components/custom/media-list";
import InfoCard from "@/components/custom/info-card";
import CreatePlaylistModal from "@/components/custom/create-playlist";
import InviteList from "@/components/custom/invite-list";
import { PlaylistInvite } from "@/types/invites";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

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

  const { toast } = useToast();

  const handleAcceptInvite = useCallback(
    async (invite: PlaylistInvite) => {
      try {
        await acceptPlaylistInvite(invite.from_id, invite.playlist_id);
        refetchPlaylistInvites();
        refetchPlaylists();
      } catch (error) {
        toast({
          title: "Error accepting invite",
          variant: "destructive",
        });
      }
    },
    [refetchPlaylistInvites, toast],
  );

  const handleDeclineInvite = useCallback(
    async (invite: PlaylistInvite) => {
      try {
        await rejectPlaylistInvite(invite.from_id, invite.playlist_id);
        refetchPlaylistInvites();
        refetchPlaylists();
      } catch (error) {
        toast({
          title: "Error declining invite",
          variant: "destructive",
        });
      }
    },
    [refetchPlaylistInvites, toast],
  );

  function renderPlaylists() {
    if (playlistsLoading) {
      return <MediaList media={[]} loading={true} />; //display skeleton
    } else if (playlistsErr || !playlists) {
      return <InfoCard text={"Something went wrong"} />;
    } else if (playlists.length === 0) {
      return (
        <InfoCard text="No playlists yet in your library. Create one or ask your friends to invite you to one." />
      );
    } else {
      return <MediaList media={playlists} title="Playlists" />;
    }
  }
  function renderPlaylistInvites() {
    if (playlistInvitesLoading) {
      return null;
    } else if (playlistInvitesErr || !playlistInvites) {
      return <InfoCard text={"Something went wrong"} />;
    } else if (playlistInvites.length === 0) {
      return null;
    } else {
      return (
        <InviteList
          invites={playlistInvites}
          title="Playlist Invites"
          refetch={refetchPlaylistInvites}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
      );
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <CreatePlaylistModal onSuccess={refetchPlaylists} />
      </div>
      {renderPlaylists()}
      {renderPlaylistInvites()}
    </section>
  );
}
