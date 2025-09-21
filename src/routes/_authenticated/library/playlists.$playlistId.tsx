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
  EllipsisVertical,
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
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Playlist } from "@/api/types/media";
import { queryClient } from "@/lib/query";
import { useMediaStore } from "@/lib/media";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId",
)({
  component: RouteComponent,
  params: {
    parse: function (params) {
      // playlist id is a string now
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
  const media = useMediaStore((state) => state.media);
  const playbackState = useMediaStore((state) => state.playbackState);
  const playPauseToggle = useMediaStore((state) => state.playPauseToggle);
  const setMedia = useMediaStore((state) => state.setMedia);

  const playlistIndexMatch = useMatch({
    from: "/_authenticated/library/playlists/$playlistId/",
    shouldThrow: false,
  });
  const playlistIndexRendered = playlistIndexMatch !== undefined;

  const { playlistId } = Route.useParams();
  const {
    data: playlist,
    isLoading: playlistLoading,
    error: playlistError,
  } = usePlaylistInfo(playlistId);

  const [dialogOpenStates, setDialogOpenStates] = useState({
    addMember: false,
    deletePlaylist: false,
  });
  const router = useRouter();

  const deletePlaylistMutation = useDeletePlaylist();

  // this will also load the audiofiles in store so we can safely call play.
  const { storeKey, queryKey } = usePlaylistAudiofiles(playlistId);

  async function handleDeletePlaylist(playlistToDelete: Playlist) {
    try {
      await deletePlaylistMutation(playlistToDelete);
      toast("Playlist deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      router.navigate({
        from: Route.fullPath,
        to: "/library",
      });
    } catch (error) {
      toast("Error deleting playlist", { description: "Please try again." });
    }
  }

  async function handleLeavePlaylist() {
    try {
      await leavePlaylist(playlistId);
      toast("Successfully left the playlist");
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
      toast("Error leaving playlist", {
        description: message,
      });
    }
  }

  if (playlistLoading) {
    return (
      <section className="flex flex-col gap-4">
        {" "}
        <div className="flex gap-4 h-40 md:h-44">
          <Skeleton className="h-full aspect-square rounded-md flex-shrink-0" />

          <div className="flex flex-col gap-1 flex-grow justify-end">
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-7/12" />{" "}
            <Skeleton className="h-6 w-1/3" />
            <div className="flex items-center gap-2 mt-2">
              {" "}
              <Skeleton className="h-9 w-28" /> <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (playlistError) {
    return <InfoCard text={"Something went wrong loading the playlist."} />;
  }

  if (!playlist) {
    return <InfoCard text="Playlist not found." />;
  }

  const getPlaybackButton = () => {
    if (media?.storeKey === storeKey) {
      if (playbackState === "playing") {
        return (
          <Button onClick={() => playPauseToggle()} variant="outline" size="sm">
            <Pause />
          </Button>
        );
      } else if (playbackState === "loading") {
        return (
          <Button variant="outline" size="sm">
            <LoaderCircle className="animate-spin" />
          </Button>
        );
      } else {
        return (
          <Button onClick={() => playPauseToggle()} variant="outline" size="sm">
            <Play />
          </Button>
        );
      }
    } else {
      return (
        <Button
          onClick={() => setMedia(storeKey, queryKey)}
          variant="default"
          size="sm"
        >
          <Play />
        </Button>
      );
    }
  };

  function getSecondaryButton() {
    if (playlistIndexRendered) {
      return (
        <Link
          to="/library/playlists/$playlistId/upload"
          params={{ playlistId }}
          aria-label="Upload audio to playlist"
        >
          <Button variant="outline" size="sm">
            <Upload />
          </Button>
        </Link>
      );
    } else {
      return (
        <Link
          to="/library/playlists/$playlistId"
          params={{ playlistId }}
          aria-label="Playlist audio files"
        >
          <Button variant="outline" size="sm">
            <ListMusic />
          </Button>
        </Link>
      );
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-4 h-40 md:h-44">
        <div className="h-full aspect-square bg-muted rounded-md flex items-center justify-center flex-shrink-0">
          <ListMusic className="w-1/2 h-1/2 text-muted-foreground" />
        </div>

        <div className="flex flex-col gap-1 flex-grow justify-end">
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          <p className="text-md text-muted-foreground hover:text-foreground transition-colors duration-150">
            {playlist.owner_username}
          </p>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {new Date(playlist.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {getPlaybackButton()}
            {getSecondaryButton()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="More playlist actions"
                >
                  <EllipsisVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setDialogOpenStates((prevState) => ({
                      ...prevState,
                      addMember: true,
                    }));
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Add Members</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLeavePlaylist}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Leave Playlist</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="bg-destructive text-destructive-foreground focus:bg-destructive/90"
                  onSelect={(e) => {
                    e.preventDefault();
                    setDialogOpenStates((prevState) => ({
                      ...prevState,
                      deletePlaylist: true,
                    }));
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Playlist</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AddPlaylistMember
        playlistId={playlistId}
        open={dialogOpenStates.addMember}
        onOpenChange={(open) =>
          setDialogOpenStates((prevState) => ({
            ...prevState,
            addMember: open,
          }))
        }
      />

      <AlertDialog
        open={dialogOpenStates.deletePlaylist}
        onOpenChange={(open) =>
          setDialogOpenStates((prevState) => ({
            ...prevState,
            deletePlaylist: open,
          }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              playlist "{playlist.name}" and all its tracks.
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
      <Outlet />
    </section>
  );
}
