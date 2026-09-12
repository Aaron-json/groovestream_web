import { useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";

import { isApiError } from "@groovestream/api/errors";
import { createPlaylist } from "@groovestream/api/sdk";
import { addPlaylistToCache } from "@/query/media";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ResponsiveFormSheet } from "@/components/custom/responsive-form-sheet";

const CREATE_PLAYLIST_TITLE = "Create Playlist";
const CREATE_PLAYLIST_DESCRIPTION =
  "Create a playlist to store and share your favorite music.";

interface CreatePlaylistSheetProps {
  trigger: React.ReactElement;
}

export default function CreatePlaylistSheet({
  trigger,
}: CreatePlaylistSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <ResponsiveFormSheet className="flex min-h-0 flex-col">
        <SheetHeader className="p-0 pr-8 text-left">
          <SheetTitle>{CREATE_PLAYLIST_TITLE}</SheetTitle>
          <SheetDescription>{CREATE_PLAYLIST_DESCRIPTION}</SheetDescription>
        </SheetHeader>

        <CreatePlaylistForm onFinish={() => setOpen(false)} />
      </ResponsiveFormSheet>
    </Sheet>
  );
}

interface CreatePlaylistFormProps {
  onFinish: () => void;
}

function CreatePlaylistForm({ onFinish }: CreatePlaylistFormProps) {
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
      onFinish();
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit().catch(() => {
          // The mutation state below owns submit errors.
        });
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-4">
        <div className="space-y-2">
          <Label htmlFor="playlist-name">Playlist name</Label>
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : "Playlist name is required",
            }}
          >
            {(field) => {
              const hasError =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <>
                  <Input
                    id="playlist-name"
                    name={field.name}
                    value={field.state.value}
                    placeholder="e.g. Late Night Vibes"
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      createPlaylistMutation.reset();
                      field.handleChange(event.currentTarget.value);
                    }}
                    aria-invalid={hasError}
                  />
                  {hasError && (
                    <p className="text-xs text-destructive">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </>
              );
            }}
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
      </div>

      <SheetFooter className="shrink-0 flex-row items-center justify-end gap-2.5 border-t p-0 pt-4 sm:space-x-0">
        <Button
          type="button"
          variant="outline"
          onClick={onFinish}
          disabled={createPlaylistMutation.isPending}
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
              disabled={
                submitState !== "ready" || createPlaylistMutation.isPending
              }
              className="gap-2"
            >
              {createPlaylistMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              <span>
                {createPlaylistMutation.isPending
                  ? "Creating..."
                  : "Create Playlist"}
              </span>
            </Button>
          )}
        </form.Subscribe>
      </SheetFooter>
    </form>
  );
}
