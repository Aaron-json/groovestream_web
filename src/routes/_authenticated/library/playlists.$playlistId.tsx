import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouter,
  useMatch,
  useRouteContext,
} from "@tanstack/react-router";
import {
  MoreVertical,
  ListMusic,
  Trash2,
  Upload,
  Users,
  LogOut,
  Play,
  Pause,
  LoaderCircle,
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
  playlistInfoOptions,
  playlistAudiofilesOptions,
  createPlaylistAudiofileSource,
} from "@/query/media";
import InfoCard from "@/components/custom/info-card";
import { toast } from "sonner";
import { useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AudiofileTableSkeleton } from "@/components/custom/audiofile-table";
import { isApiError, type Playlist } from "@/api/types";
import { useMediaStateStore } from "@/lib/media/stores/state";
import { useShallow } from "zustand/react/shallow";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { queryClient } from "@/lib/query";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";

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
  const { media, playbackState, playPauseToggle, setMedia } =
    useMediaStateStore(
      useShallow((state) => ({
        media: state.media,
        playbackState: state.playbackState,
        playPauseToggle: state.playPauseToggle,
        setMedia: state.setMedia,
      })),
    );

  const playlistIndexMatch = useMatch({
    from: "/_authenticated/library/playlists/$playlistId/",
    shouldThrow: false,
  });
  const isOnPlaylistIndex = playlistIndexMatch !== undefined;

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

  const handleDeletePlaylist = useCallback(
    (playlist: Playlist) => {
      toast(`Deleting playlist "${playlist.name}"`, {
        description: "This may take a while",
      });
      deletePlaylist(playlist, {
        onSuccess: () => {
          const { media: currentMedia, unloadMedia } =
            useMediaStateStore.getState();
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
          const { media: currentMedia, unloadMedia } =
            useMediaStateStore.getState();
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

  const handlePlayback = useCallback(async () => {
    try {
      if (media?.audiofile.playlist_id === playlistId) {
        playPauseToggle();
      } else {
        await queryClient.ensureInfiniteQueryData(playlistAudiofilesQuery);
        if (playlistAudiofileSource.getAudiofiles().length === 0) {
          toast.info("This playlist has no tracks to play");
          return;
        }
        await setMedia(playlistAudiofileSource);
      }
    } catch (error) {
      toast.error("Playback Error", {
        description:
          error instanceof Error ? error.message : "Unable to play playlist",
      });
    }
  }, [
    media?.audiofile.playlist_id,
    playPauseToggle,
    playlistAudiofilesQuery,
    playlistAudiofileSource,
    playlistId,
    setMedia,
  ]);

  const isCurrentPlaylist = media?.audiofile.playlist_id === playlistId;
  const isPlaying = isCurrentPlaylist && playbackState === "playing";
  const isLoading = isCurrentPlaylist && playbackState === "loading";

  return (
    <section className="flex h-full flex-col gap-6">
      <div className="flex gap-4 rounded-lg border bg-card p-4">
        {/* Playlist Cover */}
        <AspectRatio
          ratio={1}
          className="w-32 h-32 md:w-40 md:h-40 bg-secondary rounded-lg flex items-center justify-center shrink-0"
        >
          <ListMusic className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
        </AspectRatio>

        {/* Playlist Info */}
        <div className="flex flex-col justify-end min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
              {playlist.name}
            </h1>
            <p className="text-muted-foreground hover:text-foreground transition-colors">
              Created by {playlist.owner_username}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(playlist.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              onClick={handlePlayback}
              variant={isCurrentPlaylist ? "outline" : "default"}
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="w-12">
                {isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
              </span>
            </Button>

            {isOnPlaylistIndex ? (
              <Link
                to="/library/playlists/$playlistId/upload"
                params={{ playlistId }}
                className="flex items-center gap-1"
              >
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                  <span className="w-12">Upload</span>
                </Button>
              </Link>
            ) : (
              <Link to="/library/playlists/$playlistId" params={{ playlistId }}>
                <Button variant="outline" size="sm">
                  <ListMusic className="h-4 w-4" />
                  <span className="w-12">Tracks</span>
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuGroup>
                  {user?.id === playlist.owner_id && (
                    <DropdownMenuItem
                      onClick={() => {
                        setDialogState((prev) => ({
                          ...prev,
                          addMember: true,
                        }));
                      }}
                    >
                      <Users className="mr-1 h-4 w-4" />
                      Add Members
                    </DropdownMenuItem>
                  )}

                  {(!user || user.id !== playlist.owner_id) && (
                    <DropdownMenuItem
                      onClick={() => {
                        setDialogState((prev) => ({
                          ...prev,
                          leavePlaylist: true,
                        }));
                      }}
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Leave Playlist
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {user?.id === playlist.owner_id && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setDialogState((prev) => ({
                          ...prev,
                          deletePlaylist: true,
                        }));
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete Playlist
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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

      {/* Page Content */}
      <div className="h-full min-h-0">
        <Outlet />
      </div>
    </section>
  );
}

function PlaylistSkeleton() {
  return (
    <section className="flex h-full flex-col gap-6">
      <div className="flex gap-4 rounded-lg border bg-card p-4">
        <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-lg shrink-0" />
        <div className="flex flex-col justify-end min-w-0 flex-1 space-y-2">
          <div className="space-y-2">
            <Skeleton className="h-8 md:h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>

      <div className="h-full min-h-0">
        <div className="flex max-h-full flex-col rounded-md border">
          <div className="shrink-0 border-b p-3">
            <Skeleton className="h-8 w-full" />
          </div>
          <AudiofileTableSkeleton />
        </div>
      </div>
    </section>
  );
}
