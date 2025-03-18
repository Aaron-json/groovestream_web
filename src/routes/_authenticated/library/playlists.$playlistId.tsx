import { leavePlaylist } from "@/api/requests/media";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { EllipsisVertical, ListMusic, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import FileUpload from "@/components/custom/file-upload";
import AddPlaylistMember from "@/components/custom/add-playlist-member";
import {
  useDeletePlaylist,
  usePlaylistAudioFiles,
  usePlaylistInfo,
} from "@/hooks/media";
import InfoCard from "@/components/custom/info-card";
import AudiofileTable from "@/components/custom/audiofile-table";
import { ResponseError } from "@/api/types/errors";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Audiofile, Playlist } from "@/api/types/media";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId",
)({
  component: RouteComponent,
  params: {
    parse: function (params) {
      // verify that the playlist id is valid
      const playlist_id = +params.playlistId;
      if (!Number.isInteger(playlist_id)) {
        throw new Error("Invalid playlist id");
      }
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
  const { playlistId } = Route.useParams();
  const {
    data: playlist,
    isLoading: playlistLoading,
    error: playlistError,
  } = usePlaylistInfo(playlistId);

  const {
    data: audiofiles,
    isLoading: audiofilesLoading,
    error: audiofilesError,
    refetch: refetchAudiofiles,
    key: storeKey,
  } = usePlaylistAudioFiles(playlistId);

  const [dialogOpenStates, setDialogOpenStates] = useState({
    addMember: false,
    fileUpload: false,
    deletePlaylist: false,
  });
  const { navigate } = useRouter();

  const deletePlaylistFunc = useDeletePlaylist();

  async function handleDeletePlaylist(playlist: Playlist) {
    navigate({
      from: Route.fullPath,
      to: "/library",
    });
    await deletePlaylistFunc(playlist);
  }

  async function handleLeavePlaylist() {
    try {
      await leavePlaylist(playlistId);
      navigate({
        from: Route.fullPath,
        to: "/library",
      });
    } catch (error: any) {
      let message = undefined;
      if (isAxiosError<ResponseError>(error)) {
        const errorCode = error.response?.data.error_code;
        if (errorCode === "OWNER_CANNOT_LEAVE") {
          message = "The owner of a playlist cannot leave";
        }
      }
      toast("Error leaving playlist", {
        description: message,
      });
    }
  }

  function renderAudiofiles(audiofiles: Audiofile[]) {
    if (audiofiles.length === 0) {
      return <InfoCard text="No tracks in this playlist yet" />;
    } else {
      return (
        <AudiofileTable
          audiofiles={audiofiles}
          mediaStoreKey={storeKey}
          refetch={refetchAudiofiles}
        />
      );
    }
  }

  if (!playlist || !audiofiles || playlistLoading || audiofilesLoading) {
    return (
      <div className="flex gap-4 space-auto px-10">
        <Skeleton className="w-44 aspect-square rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="w-60 h-5" />
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-40 h-5" />
        </div>
      </div>
    );
  }
  if (audiofilesError || playlistError) {
    return <InfoCard text={"Something went wrong"} />;
  }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-4 px-10">
        <div className="w-44 aspect-square border rounded-md overflow-hidden">
          <ListMusic className="w-full h-full text-muted-foreground" />
        </div>
        <div className="flex flex-col justify-center gap-2">
          <h1 className="text-2xl">{playlist.name}</h1>
          <p className="text-muted-foreground text-sm">
            Created by{" "}
            <span className="font-medium">{playlist.owner_username}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {new Date(playlist.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm font-medium">
            {audiofiles.length} {audiofiles.length === 1 ? "track" : "tracks"}
          </p>
          <div className="flex items-center">
            <AlertDialog
              open={dialogOpenStates.deletePlaylist}
              onOpenChange={(open) =>
                setDialogOpenStates({
                  ...dialogOpenStates,
                  deletePlaylist: open,
                })
              }
            >
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All audio in this playlist
                    will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeletePlaylist(playlist)}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <FileUpload
              open={dialogOpenStates.fileUpload}
              onOpenChange={(open) =>
                setDialogOpenStates({ ...dialogOpenStates, fileUpload: open })
              }
              playlist={playlist}
              onSuccess={refetchAudiofiles}
            />
            <AddPlaylistMember
              open={dialogOpenStates.addMember}
              onOpenChange={(open) =>
                setDialogOpenStates({ ...dialogOpenStates, addMember: open })
              }
              playlistId={playlistId}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleLeavePlaylist}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Leave Playlist</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {renderAudiofiles(audiofiles)}
    </section>
  );
}
