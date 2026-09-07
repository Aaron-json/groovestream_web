import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createPlaylist } from "@groovestream/api/sdk";
import { isApiError } from "@groovestream/api/errors";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { addPlaylistToCache } from "@/query/media";

const CREATE_PLAYLIST_TITLE = "Create Playlist";
const CREATE_PLAYLIST_DESCRIPTION =
  "Create a playlist to store and share your favorite music.";

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
        <DialogContent className="flex flex-col items-center justify-center">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl font-semibold">
              {CREATE_PLAYLIST_TITLE}
            </DialogTitle>
            <DialogDescription>{CREATE_PLAYLIST_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <CreatePlaylistForm onFinish={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger render={trigger} />
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{CREATE_PLAYLIST_TITLE}</DrawerTitle>
            <DrawerDescription>{CREATE_PLAYLIST_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="flex justify-center p-4">
            <CreatePlaylistForm onFinish={() => setOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
}

interface CreatePlaylistFormProps {
  onFinish?: () => void;
}
export function CreatePlaylistForm({ onFinish }: CreatePlaylistFormProps) {
  const createPlaylistMutation = useMutation({
    mutationFn: (name: string) => createPlaylist({ body: { name } }),
  });
  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value, formApi }) => {
      const playlist = await createPlaylistMutation.mutateAsync(
        value.name.trim(),
      );
      addPlaylistToCache(playlist);
      formApi.reset();
      toast.success("Playlist created");
      onFinish?.();
    },
  });

  const submit = () => {
    void form.handleSubmit().catch(() => {
      // The mutation state below owns submit errors.
    });
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      id="create-playlist-form"
      className="flex flex-col items-center w-full max-w-96 gap-4"
    >
      <div className="w-full grid gap-2">
        <Label htmlFor="playlist-name">Playlist Name</Label>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : "Playlist name is required",
          }}
        >
          {(field) => (
            <>
              <Input
                id="playlist-name"
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  createPlaylistMutation.reset();
                  field.handleChange(event.currentTarget.value);
                }}
                aria-invalid={!field.state.meta.isValid}
              />
              {field.state.meta.errors[0] && (
                <p className="text-sm text-destructive">
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </>
          )}
        </form.Field>
      </div>

      {createPlaylistMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {isApiError(createPlaylistMutation.error)
              ? createPlaylistMutation.error.message
              : "An unexpected error occurred."}
          </AlertDescription>
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
        <form.Subscribe
          selector={(state) =>
            state.isSubmitting
              ? "submitting"
              : state.canSubmit && !state.isPristine
                ? "ready"
                : "disabled"
          }
        >
          {(submitState) => (
            <Button
              type="submit"
              variant="default"
              disabled={submitState !== "ready"}
              className="flex-1 max-w-sm"
            >
              {submitState === "submitting" ? "Loading..." : "Create"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
