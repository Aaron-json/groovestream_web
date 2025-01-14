import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserPlaylists } from "@/api/requests/media";
import MediaList from "@/components/custom/media-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { createPlaylist } from "@/api/requests/media";
import InfoCard from "@/components/custom/info-card";

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
      return <MediaList media={playlists} />;
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <CreatePlaylistModal onSuccess={refetchPlaylists} />
      </div>
      {renderPlaylists()}
    </section>
  );
}

type CreatePlaylistValues = {
  name: string;
};

type CreatePlaylistProps = {
  onSuccess?: () => void;
};

function CreatePlaylistModal(props: CreatePlaylistProps) {
  const { register, handleSubmit, formState, setError } =
    useForm<CreatePlaylistValues>({
      defaultValues: {
        name: "",
      },
    });

  const onSubmit = async (data: CreatePlaylistValues) => {
    try {
      // use await so the error is caught
      await createPlaylist(data.name);
      props.onSuccess?.();
    } catch (err: any) {
      console.log(err);
      const message = err.message ?? "An unexpected error occurred.";
      setError("root", {
        message,
      });
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="h-4 w-4 mr-2" />
          Create Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
          <DialogDescription>
            Create a playlist to store and share your favorite music.
          </DialogDescription>
        </DialogHeader>
        {formState.isSubmitSuccessful && (
          <div className="flex items-center rounded-md border p-2">
            <Check className="mr-2 h-5 w-5" />
            <span className="text-sm">Playlist created successfully</span>
          </div>
        )}
        {formState.errors.root && (
          <div className="flex items-center rounded-md border-destructive/50 bg-destructive/10 p-2">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span className="text-sm">{formState.errors.root.message}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              {...register("name", {
                required: "Playlist name is required",
              })}
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <DialogClose asChild>
            <Button type="submit" variant="ghost">
              Close
            </Button>
          </DialogClose>
          <Button
            type="submit"
            variant="default"
            onClick={handleSubmit(onSubmit)}
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Loading..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
