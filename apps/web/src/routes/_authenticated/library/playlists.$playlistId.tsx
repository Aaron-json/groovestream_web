import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useDeletePlaylist,
  useLeavePlaylist,
  createPlaylistAudiofileSource,
} from "@/query/media";
import {
  playlistAudiofilesOptions,
  playlistInfoOptions,
} from "@groovestream/query/media";
import { getAudioSourcePosition } from "@groovestream/media/source";
import InfoCard from "@/components/custom/info-card";
import {
  PlaylistHeader,
  PlaylistHeaderSkeleton,
} from "@/components/custom/playlist-header";
import { RenamePlaylistSheet } from "@/components/custom/rename-playlist";
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistAudiofileTableSkeleton } from "@/components/custom/audiofile-table";
import { isApiError } from "@groovestream/api/errors";
import type { Playlist } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { useShallow } from "zustand/react/shallow";
import { queryClient } from "@/lib/query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";

type PlaylistOverlay = "renamePlaylist" | "deletePlaylist" | "leavePlaylist";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId",
)({
  component: RouteComponent,
  loader: ({ params }) => {
    return queryClient.ensureQueryData(playlistInfoOptions(params.playlistId));
  },
  pendingMs: 200,
  pendingComponent: PlaylistSkeleton,
  errorComponent: () => (
    <InfoCard
      variant="destructive"
      title="Error"
      text="Something went wrong loading the playlist."
    />
  ),
  staticData: {
    // The playlist route is not nested under the library route, so it
    // contributes its logical parent to the trail as well.
    crumbs: (params) => [
      { label: "Library", to: "/library" },
      {
        label: <PlaylistCrumb playlistId={params.playlistId} />,
        to: "/library/playlists/$playlistId",
        params,
      },
    ],
  },
  params: {
    parse: function (params) {
      const playlist_id = params.playlistId;
      return { playlistId: playlist_id };
    },
  },
  onError: () => {
    throw redirect({
      to: "/library",
    });
  },
});

// Breadcrumb label that resolves once the playlist metadata query
// has data.
function PlaylistCrumb({ playlistId }: { playlistId: Playlist["id"] }) {
  // MUST not use useSuspenseQuery here, because the crumb is rendered
  // without a suspense boundary necessarily.
  const { data: playlist } = useQuery(playlistInfoOptions(playlistId));
  return playlist?.name ?? "Loading...";
}

function RouteComponent() {
  const { media, playbackState, playPauseToggle, setMedia } = usePlaybackStore(
    useShallow((state) => ({
      media: state.playerState.currentMedia,
      playbackState: state.playerState.status,
      playPauseToggle: state.playPauseToggle,
      setMedia: state.setMedia,
    })),
  );

  const { playlistId } = Route.useParams();
  const { data: playlist } = useSuspenseQuery(playlistInfoOptions(playlistId));

  const [activeOverlay, setActiveOverlay] = useState<PlaylistOverlay>();

  const router = useRouter();
  const { mutate: deletePlaylist } = useDeletePlaylist();
  const { mutate: leavePlaylist } = useLeavePlaylist();
  const playlistAudiofilesQuery = playlistAudiofilesOptions(playlistId);
  const playlistAudiofileSource = useMemo(
    () => createPlaylistAudiofileSource(playlistId),
    [playlistId],
  );
  const isCurrentPlaylist = media?.item.audiofile.playlist_id === playlistId;

  const handleDeletePlaylist = useCallback(
    (playlist: Playlist) => {
      toast(`Deleting playlist "${playlist.name}"`, {
        description: "This may take a while",
      });
      deletePlaylist(playlist, {
        onSuccess: () => {
          const { playerState, unloadMedia } = usePlaybackStore.getState();
          const currentMedia = playerState.currentMedia;
          if (currentMedia?.item.audiofile.playlist_id === playlist.id) {
            unloadMedia();
          }
          toast.success("Playlist deleted successfully");
          router.navigate({
            from: Route.fullPath,
            to: "/library",
          });
        },
        onError: () =>
          toast.error(`Error deleting playlist "${playlist.name}"`),
      });
    },
    [deletePlaylist, router],
  );

  const handleLeavePlaylist = useCallback(
    (playlist: Playlist) => {
      leavePlaylist(playlist, {
        onSuccess: () => {
          const { playerState, unloadMedia } = usePlaybackStore.getState();
          const currentMedia = playerState.currentMedia;
          if (currentMedia?.item.audiofile.playlist_id === playlist.id) {
            unloadMedia();
          }
          toast.success(`Successfully left the playlist "${playlist.name}"`);
          router.navigate({
            from: Route.fullPath,
            to: "/library",
          });
        },
        onError: (error) => {
          let message = "Could not leave the playlist. Please try again.";
          if (isApiError(error)) {
            const errorCode = error.error_code;
            if (errorCode === "OWNER_CANNOT_LEAVE") {
              message = "The owner of a playlist cannot leave it.";
            } else {
              message = error.message;
            }
          }
          toast.error(`Error leaving playlist "${playlist.name}"`, {
            description: message,
          });
        },
      });
    },
    [leavePlaylist, router],
  );

  async function startPlayback() {
    if (isCurrentPlaylist) {
      await playPauseToggle();
      return;
    }

    await queryClient.ensureInfiniteQueryData(playlistAudiofilesQuery);
    const firstPosition = getAudioSourcePosition(playlistAudiofileSource, 0);
    if (!firstPosition) {
      toast.info("This playlist has no tracks to play");
      return;
    }
    await setMedia(firstPosition);
  }

  function handlePlayback() {
    startPlayback().catch((error) => {
      toast.error("Playback Error", {
        description:
          error instanceof Error ? error.message : "Unable to play playlist",
      });
    });
  }

  const isPlaying = isCurrentPlaylist && playbackState === "playing";
  const isLoading = isCurrentPlaylist && playbackState === "loading";
  const playlistPlaybackState = isLoading
    ? "loading"
    : isPlaying
      ? "playing"
      : "idle";
  return (
    <section className="space-y-6 pb-8">
      <PlaylistHeader
        playlist={playlist}
        playbackState={playlistPlaybackState}
        onPlayback={handlePlayback}
        onRename={() => setActiveOverlay("renamePlaylist")}
        onDelete={() => setActiveOverlay("deletePlaylist")}
        onLeave={() => setActiveOverlay("leavePlaylist")}
      />

      <RenamePlaylistSheet
        playlist={playlist}
        open={activeOverlay === "renamePlaylist"}
        onOpenChange={(open) => {
          if (!open) setActiveOverlay(undefined);
        }}
      />

      <AlertDialog
        open={activeOverlay === "leavePlaylist"}
        onOpenChange={(open) => {
          if (!open) setActiveOverlay(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <strong>"{playlist.name}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleLeavePlaylist(playlist)}
            >
              Leave Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activeOverlay === "deletePlaylist"}
        onOpenChange={(open) => {
          if (!open) setActiveOverlay(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{playlist.name}"</strong>
              ? This action cannot be undone and will permanently remove the
              playlist and all its tracks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setActiveOverlay(undefined);
                handleDeletePlaylist(playlist);
              }}
            >
              Delete Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Outlet />
    </section>
  );
}

function PlaylistSkeleton() {
  return (
    <section className="space-y-6 pb-8">
      <PlaylistHeaderSkeleton />

      <div className="overflow-hidden rounded-xl border">
        <div className="shrink-0 border-b p-3">
          <Skeleton className="h-8 w-full" />
        </div>
        <PlaylistAudiofileTableSkeleton />
      </div>
    </section>
  );
}
