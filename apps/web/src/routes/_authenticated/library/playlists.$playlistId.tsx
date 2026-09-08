import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
  useRouteContext,
} from "@tanstack/react-router";
import {
  ListMusic,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
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
import AddPlaylistMember from "@/components/custom/add-playlist-member";
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
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AudiofileTableSkeleton } from "@/components/custom/audiofile-table";
import { isApiError } from "@groovestream/api/errors";
import type { Playlist } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { useShallow } from "zustand/react/shallow";
import { queryClient } from "@/lib/query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";

type PlaylistDialog = "addMember" | "deletePlaylist" | "leavePlaylist";
type PlaylistPlaybackState = "idle" | "loading" | "playing";

const playlistNavigation = [
  {
    label: "Tracks",
    to: "/library/playlists/$playlistId",
    icon: ListMusic,
  },
  {
    label: "Upload",
    to: "/library/playlists/$playlistId/upload",
    icon: Upload,
  },
] as const;

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

  const [dialogState, setDialogState] = useState({
    addMember: false,
    deletePlaylist: false,
    leavePlaylist: false,
  });

  const router = useRouter();
  const { user } = useRouteContext({ from: "__root__" });
  const { mutate: deletePlaylist } = useDeletePlaylist();
  const { mutate: leavePlaylist } = useLeavePlaylist();
  const playlistAudiofilesQuery = useMemo(
    () => playlistAudiofilesOptions(playlistId),
    [playlistId],
  );
  const playlistAudiofileSource = useMemo(
    () => createPlaylistAudiofileSource(playlistId),
    [playlistId],
  );
  const isCurrentPlaylist = media?.audiofile.playlist_id === playlistId;

  const handleDeletePlaylist = useCallback(
    (playlist: Playlist) => {
      toast(`Deleting playlist "${playlist.name}"`, {
        description: "This may take a while",
      });
      deletePlaylist(playlist, {
        onSuccess: () => {
          const { playerState, unloadMedia } = usePlaybackStore.getState();
          const currentMedia = playerState.currentMedia;
          if (currentMedia?.audiofile.playlist_id === playlist.id) {
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
          if (currentMedia?.audiofile.playlist_id === playlist.id) {
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
    void startPlayback().catch((error) => {
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
  const isOwner = user?.id === playlist.owner_id;

  function openDialog(dialog: PlaylistDialog) {
    setDialogState((previous) => ({ ...previous, [dialog]: true }));
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-5">
      <PlaylistHeader
        playlist={playlist}
        playbackState={playlistPlaybackState}
        onPlayback={handlePlayback}
        isOwner={isOwner}
        onOpenDialog={openDialog}
      />

      <AddPlaylistMember
        playlistId={playlistId}
        open={dialogState.addMember}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, addMember: open }))
        }
      />
      <AlertDialog
        open={dialogState.leavePlaylist}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, leavePlaylist: open }))
        }
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
        open={dialogState.deletePlaylist}
        onOpenChange={(open) =>
          setDialogState((prev) => ({ ...prev, deletePlaylist: open }))
        }
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
                setDialogState((prev) => ({ ...prev, deletePlaylist: false }));
                handleDeletePlaylist(playlist);
              }}
            >
              Delete Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </section>
  );
}

function PlaylistSkeleton() {
  return (
    <section className="flex h-full min-h-0 flex-col gap-5">
      <PlaylistHeaderSkeleton />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        <div className="shrink-0 border-b p-3">
          <Skeleton className="h-8 w-full" />
        </div>
        <AudiofileTableSkeleton />
      </div>
    </section>
  );
}

type PlaylistHeaderProps = Readonly<{
  playlist: Playlist;
  playbackState: PlaylistPlaybackState;
  isOwner: boolean;
  onPlayback: () => void;
  onOpenDialog: (dialog: PlaylistDialog) => void;
}>;

function PlaylistHeader({
  playlist,
  playbackState,
  isOwner,
  onPlayback,
  onOpenDialog,
}: PlaylistHeaderProps) {
  const isLoading = playbackState === "loading";
  const isPlaying = playbackState === "playing";

  return (
    <header className="shrink-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground sm:size-28 md:size-32">
          <ListMusic className="size-10 sm:size-12" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-end gap-1.5">
          <h1
            className="truncate text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl"
            title={playlist.name}
          >
            {playlist.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground sm:text-sm">
            <span className="font-medium text-foreground">
              {playlist.owner_username}
            </span>
            <span aria-hidden="true">•</span>
            <span>
              {new Date(playlist.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <Button
              type="button"
              onClick={onPlayback}
              variant={isPlaying ? "outline" : "default"}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : isPlaying ? (
                <Pause />
              ) : (
                <Play />
              )}
              {isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Playlist actions"
                  >
                    <MoreHorizontal />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  {isOwner ? (
                    <DropdownMenuItem onClick={() => onOpenDialog("addMember")}>
                      <Users />
                      Add members
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onOpenDialog("leavePlaylist")}
                    >
                      <LogOut />
                      Leave playlist
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onOpenDialog("deletePlaylist")}
                      >
                        <Trash2 />
                        Delete playlist
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <nav
        aria-label="Playlist sections"
        className="-mb-px flex min-w-0 gap-1 overflow-x-auto border-b text-sm"
      >
        {playlistNavigation.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            params={{ playlistId: playlist.id }}
            activeOptions={{ exact: true }}
            className="flex items-center gap-2 border-b-2 px-4 py-2.5 font-medium transition-colors"
            activeProps={{
              className: "border-primary text-foreground",
            }}
            inactiveProps={{
              className:
                "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            }}
          >
            <item.icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}

function PlaylistHeaderSkeleton() {
  return (
    <div className="shrink-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <Skeleton className="size-24 shrink-0 rounded-lg sm:size-28 md:size-32" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-56 sm:w-72" />
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-2 pt-1.5">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 border-b pb-2.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}
