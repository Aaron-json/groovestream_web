import { useForm } from "@tanstack/react-form";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import type { PlaylistDetails } from "@groovestream/api/models";

import { ResponsiveFormSheet } from "@/components/custom/responsive-form-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRenamePlaylist } from "@/query/media";

interface RenamePlaylistSheetProps {
  playlist: PlaylistDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenamePlaylistSheet({
  playlist,
  open,
  onOpenChange,
}: RenamePlaylistSheetProps) {
  const renamePlaylist = useRenamePlaylist();
  const form = useForm({
    defaultValues: { name: playlist.name },
    onSubmit: async ({ value, formApi }) => {
      const name = value.name.trim();
      await renamePlaylist.mutateAsync({ playlistId: playlist.id, name });
      formApi.reset({ name });
      toast.success("Playlist renamed");
      onOpenChange(false);
    },
  });

  function closeSheet() {
    form.reset({ name: playlist.name });
    renamePlaylist.reset();
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeSheet();
      }}
    >
      <ResponsiveFormSheet className="flex min-h-0 flex-col">
        <SheetHeader className="p-0 pr-8 text-left">
          <SheetTitle>Rename playlist</SheetTitle>
          <SheetDescription>
            Choose a clear name that is easy for members to recognize.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit().catch(() => {
              // The mutation state below owns submit errors.
            });
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-playlist-name">Playlist name</Label>
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const name = value.trim();
                    if (!name) return "Playlist name is required";
                    if (name === playlist.name) {
                      return "Enter a different playlist name";
                    }
                  },
                }}
              >
                {(field) => {
                  const hasError =
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0;

                  return (
                    <>
                      <Input
                        id="rename-playlist-name"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          renamePlaylist.reset();
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

            {renamePlaylist.isError && (
              <p className="mt-3 text-sm text-destructive">
                Could not rename this playlist. Please try again.
              </p>
            )}
          </div>

          <SheetFooter className="shrink-0 flex-row items-center justify-end gap-2.5 border-t p-0 pt-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeSheet}
              disabled={renamePlaylist.isPending}
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
                  disabled={submitState !== "ready" || renamePlaylist.isPending}
                >
                  {renamePlaylist.isPending && (
                    <LoaderCircle className="animate-spin" />
                  )}
                  {renamePlaylist.isPending ? "Saving..." : "Save name"}
                </Button>
              )}
            </form.Subscribe>
          </SheetFooter>
        </form>
      </ResponsiveFormSheet>
    </Sheet>
  );
}
