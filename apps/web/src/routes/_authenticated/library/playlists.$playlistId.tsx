import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import {
  ListMusic,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  Pause,
  PencilLine,
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
  DropdownMenuGroup,
  DropdownMenuSeparator,
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
import { RenamePlaylistSheet } from "@/components/custom/rename-playlist";
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AudiofileTableSkeleton } from "@/components/custom/audiofile-table";
import { isApiError } from "@groovestream/api/errors";
import type { Playlist, PlaylistDetails } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { useShallow } from "zustand/react/shallow";
import { queryClient } from "@/lib/query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";

type PlaylistOverlay = "renamePlaylist" | "deletePlaylist" | "leavePlaylist";
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
    requiresWrite: true,
  },
  {
    label: "Members",
    to: "/library/playlists/$playlistId/members",
    icon: Users,
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

  const [activeOverlay, setActiveOverlay] = useState<PlaylistOverlay>();

  const router = useRouter();
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
  const isOwner = playlist.access_level === "OWNER";
  const canWrite =
    playlist.access_level === "WRITE" || playlist.access_level === "OWNER";

  return (
    <section className="space-y-6 pb-8">
      <PlaylistHeader
        playlist={playlist}
        playbackState={playlistPlaybackState}
        onPlayback={handlePlayback}
        isOwner={isOwner}
        canWrite={canWrite}
        onOpenOverlay={setActiveOverlay}
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
        <AudiofileTableSkeleton />
      </div>
    </section>
  );
}

type PlaylistHeaderProps = Readonly<{
  playlist: PlaylistDetails;
  playbackState: PlaylistPlaybackState;
  isOwner: boolean;
  canWrite: boolean;
  onPlayback: () => void;
  onOpenOverlay: (overlay: PlaylistOverlay) => void;
}>;

function PlaylistHeader({
  playlist,
  playbackState,
  isOwner,
  canWrite,
  onPlayback,
  onOpenOverlay,
}: PlaylistHeaderProps) {
  const isLoading = playbackState === "loading";
  const isPlaying = playbackState === "playing";

  return (
    <header className="space-y-4">
      <div className="@container rounded-xl border bg-card p-4 shadow-xs sm:p-5">
        <div className="flex min-w-0 items-start gap-4 @[520px]:items-end @[520px]:gap-5">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-foreground/10 @[520px]:size-28">
            <ListMusic className="size-8 @[520px]:size-11" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="uppercase tracking-wider">Playlist</span>
              <span aria-hidden="true">·</span>
              <span className="rounded-md border bg-background/60 px-1.5 py-0.5">
                {playlistAccessLabel(playlist.access_level)}
              </span>
            </div>

            <h1
              className="mt-1 line-clamp-2 text-balance text-2xl font-bold tracking-tight @[520px]:text-4xl"
              title={playlist.name}
            >
              {playlist.name}
            </h1>

            <p className="mt-1 truncate text-xs text-muted-foreground @[520px]:text-sm">
              <span className="font-medium text-foreground">
                {playlist.owner_username}
              </span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              {new Date(playlist.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuGroup>
                    {canWrite && (
                      <DropdownMenuItem
                        onClick={() => onOpenOverlay("renamePlaylist")}
                      >
                        <PencilLine />
                        Rename playlist
                      </DropdownMenuItem>
                    )}
                    {canWrite && <DropdownMenuSeparator />}
                    {isOwner && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onOpenOverlay("deletePlaylist")}
                      >
                        <Trash2 />
                        Delete playlist
                      </DropdownMenuItem>
                    )}
                    {!isOwner && (
                      <DropdownMenuItem
                        onClick={() => onOpenOverlay("leavePlaylist")}
                      >
                        <LogOut />
                        Leave playlist
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="Playlist sections"
        className="-mb-px flex min-w-0 gap-1 overflow-x-auto border-b text-sm"
      >
        {playlistNavigation
          .filter((item) => !("requiresWrite" in item) || canWrite)
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ playlistId: playlist.id }}
              activeOptions={{ exact: true }}
              className="flex min-w-fit items-center justify-center gap-2 border-b-2 px-3 py-2.5 font-medium transition-colors sm:px-4"
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
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-4 sm:items-end sm:gap-5">
          <Skeleton className="size-20 shrink-0 rounded-xl sm:size-28" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-48 max-w-full sm:h-10 sm:w-72" />
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="size-8" />
            </div>
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

function playlistAccessLabel(accessLevel: PlaylistDetails["access_level"]) {
  switch (accessLevel) {
    case "OWNER":
      return "Owner";
    case "WRITE":
      return "Editor";
    case "READ":
      return "Viewer";
  }
}
