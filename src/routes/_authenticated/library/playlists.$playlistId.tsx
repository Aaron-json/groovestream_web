import { leavePlaylist } from "@/api/requests/media";
import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouter,
  useMatch,
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
  usePlaylistAudiofiles,
  usePlaylistInfo,
} from "@/hooks/media";
import InfoCard from "@/components/custom/info-card";
import { ResponseError } from "@/api/types/errors";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Playlist } from "@/api/types/media";
import { queryClient } from "@/lib/query";
import { useMediaStore } from "@/lib/media";
import { useShallow } from "zustand/react/shallow";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId",
)({
  component: RouteComponent,
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

function RouteComponent() {
  const { media, playbackState, playPauseToggle, setMedia } = useMediaStore(
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
  const {
    data: playlist,
    isLoading: playlistLoading,
    error: playlistError,
  } = usePlaylistInfo(playlistId);

  const [dialogState, setDialogState] = useState({
    addMember: false,
    deletePlaylist: false,
  });

  const router = useRouter();
  const deletePlaylistMutation = useDeletePlaylist();
  const { storeKey, queryKey } = usePlaylistAudiofiles(playlistId);

  const handleDeletePlaylist = useCallback(
    async (playlistToDelete: Playlist) => {
      try {
        await deletePlaylistMutation(playlistToDelete);
        toast.success("Playlist deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["playlists"] });
        router.navigate({
          from: Route.fullPath,
          to: "/library",
        });
      } catch (error) {
        toast.error("Error deleting playlist", {
          description: "Please try again.",
        });
      }
    },
    [deletePlaylistMutation, router],
  );

  const handleLeavePlaylist = useCallback(async () => {
    try {
      await leavePlaylist(playlistId);
      toast.success("Successfully left the playlist");
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      router.navigate({
        from: Route.fullPath,
        to: "/library",
      });
    } catch (error: unknown) {
      let message = "Could not leave the playlist. Please try again.";
      if (isAxiosError<ResponseError>(error)) {
        const errorCode = error.response?.data.error_code;
        if (errorCode === "OWNER_CANNOT_LEAVE") {
          message = "The owner of a playlist cannot leave it.";
        }
      }
      toast.error("Error leaving playlist", {
        description: message,
      });
    }
  }, [playlistId, router]);

  const handlePlayback = useCallback(async () => {
    try {
      if (media?.storeKey === storeKey) {
        playPauseToggle();
      } else {
        await setMedia(storeKey, queryKey);
      }
    } catch (error: any) {
      toast.error("Playback Error", {
        description: error?.message || "Unable to play playlist",
      });
    }
  }, [media?.storeKey, storeKey, playPauseToggle, setMedia, queryKey]);

  if (playlistLoading) {
    return <PlaylistSkeleton />;
  }

  if (playlistError) {
    return <InfoCard text="Something went wrong loading the playlist." />;
  }

  if (!playlist) {
    return <InfoCard text="Playlist not found." />;
  }

  const isCurrentPlaylist = media?.storeKey === storeKey;
  const isPlaying = isCurrentPlaylist && playbackState === "playing";
  const isLoading = isCurrentPlaylist && playbackState === "loading";

  return (
    <section className="h-full space-y-6">
      <div className="flex gap-4">
        {/* Playlist Cover */}
        <div className="w-32 h-32 md:w-40 md:h-40 bg-muted rounded-lg flex items-center justify-center shrink-0">
          <ListMusic className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground" />
        </div>

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
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setDialogState((prev) => ({ ...prev, addMember: true }));
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add Members
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLeavePlaylist}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Playlist
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="bg-destructive text-destructive-foreground focus:bg-destructive/60"
                  onSelect={(e) => {
                    e.preventDefault();
                    setDialogState((prev) => ({
                      ...prev,
                      deletePlaylist: true,
                    }));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Playlist
                </DropdownMenuItem>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDeletePlaylist(playlist)}
            >
              Delete Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Content */}
      <Outlet />
    </section>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
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
    </div>
  );
}
