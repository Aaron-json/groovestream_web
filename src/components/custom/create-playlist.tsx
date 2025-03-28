import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
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
import { AlertCircle } from "lucide-react";
import { queryClient } from "@/routes/_authenticated";

type CreatePlaylistValues = {
  name: string;
};

type CreatePlaylistProps = {
  trigger?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreatePlaylistModal(props: CreatePlaylistProps) {
  const { reset, register, handleSubmit, formState, setError } =
    useForm<CreatePlaylistValues>({
      defaultValues: {
        name: "",
      },
    });

  const trigger = props.trigger || (
    <Button variant="secondary">
      <Plus className="h-4 w-4 mr-2" />
      Create Playlist
    </Button>
  );

  // reset form data everytime it opens or closes
  useEffect(() => {
    reset();
  }, [props.open]);

  const onSubmit = async (data: CreatePlaylistValues) => {
    try {
      // use await so the error is caught
      await createPlaylist(data.name);
      props.onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    } catch (err: any) {
      const message = "An unexpected error occurred.";
      setError("root", {
        message,
      });
    }
  };
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Playlist</DialogTitle>
          <DialogDescription>
            Create a playlist to store and share your favorite music.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="create-playlist-form">
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
        </form>
        <DialogFooter className="justify-between">
          <DialogClose asChild>
            <Button type="submit" variant="ghost">
              Close
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-playlist-form"
            variant="default"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Loading..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
