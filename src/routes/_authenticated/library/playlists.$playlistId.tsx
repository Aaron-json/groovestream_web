import {
  deletePlaylist,
  getPlaylistInfo,
  leavePlaylist,
} from "@/api/requests/media";
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
import { usePlaylistAudioFiles } from "@/hooks/media";
import InfoCard from "@/components/custom/info-card";
import AudiofileTable from "@/components/custom/audiofile-table";
import { ResponseError } from "@/types/errors";
import { isAxiosError } from "axios";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId",
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    return getPlaylistInfo(+params.playlistId);
  },
  onError: () => {
    throw redirect({
      to: "/library",
    });
  },
});

function RouteComponent() {
  const playlist = Route.useLoaderData();
  const {
    data: audiofiles,
    isLoading: audiofilesLoading,
    error: audiofilesErr,
    refetch: refetchAudiofiles,
    key: storeKey,
  } = usePlaylistAudioFiles(playlist.id);
  const { navigate } = useRouter();

  async function handleDeletePlaylist() {
    try {
      await deletePlaylist(playlist.id);
      navigate({
        from: Route.fullPath,
        to: "/library",
      });
    } catch (error: any) {
      toast("Error deleting playlist");
    }
  }

  async function handleLeavePlaylist() {
    try {
      await leavePlaylist(playlist.id);
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

  function renderAudiofiles() {
    if (!audiofiles) {
      return null;
    }
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
  if (audiofilesLoading) {
    return null;
  }

  if (audiofilesErr || !audiofiles) {
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
            <AlertDialog>
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
                  <AlertDialogAction onClick={handleDeletePlaylist}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <FileUpload
              playlistId={playlist.id}
              onSuccess={refetchAudiofiles}
            />
            <AddPlaylistMember playlistId={playlist.id} />
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
      {renderAudiofiles()}
    </section>
  );
}
