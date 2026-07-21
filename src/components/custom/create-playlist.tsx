import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { createPlaylist, CreatePlaylistError } from "@/api/requests/media";
import { isAxiosError } from "axios";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { addPlaylistToCache } from "@/query/media";

type CreatePlaylistValues = {
  name: string;
};

type CreatePlaylistModalProps = {
  trigger?: React.ReactElement;
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
        <DialogTrigger render={trigger} />
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

  const onSubmit = async (data: CreatePlaylistValues) => {
    try {
      const playlist = await createPlaylist({ name: data.name });
      addPlaylistToCache(playlist);
      reset();
      toast.success("Playlist created");
      if (onFinish) onFinish();
    } catch (error) {
      let message = "An unexpected error occurred.";
      if (isAxiosError<CreatePlaylistError>(error)) {
        message = error.response?.data.message || message;
      }
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
          aria-invalid={!!formState.errors.name}
          {...register("name", { required: "required" })}
        />
        {formState.errors.name?.message && (
          <p className="text-sm text-destructive">
            {formState.errors.name.message}
          </p>
        )}
      </div>

      {formState.errors.root?.message && (
        <Alert variant="destructive">
          <AlertDescription>{formState.errors.root.message}</AlertDescription>
        </Alert>
      )}
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
