import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { createPlaylist } from "@/api/requests/media";
import { AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";

type CreatePlaylistValues = {
  name: string;
};

type CreatePlaylistModalProps = {
  trigger?: React.ReactNode;
};

export default function CreatePlaylistModal(props: CreatePlaylistModalProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const trigger = props.trigger || (
    <Button variant="secondary">
      <Plus className="h-4 w-4 mr-2" />
      Create Playlist
    </Button>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="flex items-center justify-center">
          <CreatePlaylistForm onFinish={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="flex items-center justify-center pb-4">
          <CreatePlaylistForm onFinish={() => setOpen(false)} />
        </DrawerContent>
      </Drawer>
    );
  }
}

interface CreatePlaylistFormProps {
  onFinish?: () => void;
}
export function CreatePlaylistForm({ onFinish }: CreatePlaylistFormProps) {
  const { reset, register, handleSubmit, formState, setError } =
    useForm<CreatePlaylistValues>({
      defaultValues: {
        name: "",
      },
    });

  useEffect(() => {
    reset();
  }, []);

  const onSubmit = async (data: CreatePlaylistValues) => {
    try {
      await createPlaylist(data.name);
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      reset();
      if (onFinish) onFinish();
    } catch (err: any) {
      const message = "An unexpected error occurred.";
      setError("root", {
        message,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="create-playlist-form"
      className="flex flex-col items-center w-full max-w-96 gap-4"
    >
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold">Create Playlist</h2>
        <p className="text-muted-foreground text-center">
          Create a playlist to store and share your favorite music.
        </p>
      </div>

      <div className="w-full grid gap-2">
        <Label htmlFor="playlist-name">Playlist Name</Label>
        <Input
          id="playlist-name"
          {...register("name", { required: "required" })}
        />
      </div>

      <div className="w-full flex flex-col h-8">
        {formState.isSubmitSuccessful && (
          <div className="flex items-center">
            <Check className="mr-2 h-3 w-3" />
            <span className="text-sm">Playlist created successfully</span>
          </div>
        )}
        {formState.errors.root && (
          <div className="flex items-center bg-destructive text-destructive-foreground rounded-md border p-2">
            <AlertCircle className="mr-2 h-3 w-3" />
            <span className="text-sm">{formState.errors.root.message}</span>
          </div>
        )}
      </div>
      <div className="w-full flex justify-around gap-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onFinish?.();
          }}
          className="flex-1 max-w-sm"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="default"
          disabled={formState.isSubmitting}
          className="flex-1 max-w-sm"
        >
          {formState.isSubmitting ? "Loading..." : "Create"}
        </Button>
      </div>
    </form>
  );
}
