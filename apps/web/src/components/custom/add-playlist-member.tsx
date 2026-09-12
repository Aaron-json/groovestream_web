import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Eye,
  LoaderCircle,
  Pencil,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { isApiError } from "@groovestream/api/errors";
import type { Playlist, PlaylistMember } from "@groovestream/api/models";
import { sendPlaylistInvite } from "@groovestream/api/sdk";

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
import { cn } from "@/lib/utils";

const ACCESS_OPTIONS = [
  {
    value: "read",
    label: "Can view",
    description: "Listen to tracks and view playlist details.",
    Icon: Eye,
  },
  {
    value: "write",
    label: "Can edit",
    description: "Upload, remove, and manage playlist tracks.",
    Icon: Pencil,
  },
] satisfies ReadonlyArray<{
  value: PlaylistMember["access_level"];
  label: string;
  description: string;
  Icon: typeof Eye;
}>;

interface AddPlaylistMemberSheetProps {
  playlistId: Playlist["id"];
  trigger: React.ReactElement;
}

export default function AddPlaylistMemberSheet({
  playlistId,
  trigger,
}: AddPlaylistMemberSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <ResponsiveFormSheet className="flex min-h-0 flex-col">
        <SheetHeader className="p-0 pr-8 text-left">
          <SheetTitle>Invite member</SheetTitle>
          <SheetDescription>
            Share this playlist with someone by entering their username.
          </SheetDescription>
        </SheetHeader>

        <AddPlaylistMemberForm
          playlistId={playlistId}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </ResponsiveFormSheet>
    </Sheet>
  );
}

interface AddPlaylistMemberFormProps {
  playlistId: Playlist["id"];
  onSuccess: () => void;
  onCancel: () => void;
}

function AddPlaylistMemberForm({
  playlistId,
  onSuccess,
  onCancel,
}: AddPlaylistMemberFormProps) {
  const invite = useMutation({
    mutationFn: (input: {
      username: string;
      accessLevel: PlaylistMember["access_level"];
    }) =>
      sendPlaylistInvite({
        body: {
          playlist_id: playlistId,
          username: input.username,
          access_level: input.accessLevel,
        },
      }),
  });

  const form = useForm({
    defaultValues: {
      username: "",
      accessLevel: "read" as PlaylistMember["access_level"],
    },
    onSubmit: async ({ value, formApi }) => {
      await invite.mutateAsync({
        username: value.username.trim(),
        accessLevel: value.accessLevel,
      });
      toast.success(`Invite sent to ${value.username.trim()}`);
      formApi.reset();
      onSuccess();
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
        {invite.isError && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {getInviteErrorMessage(invite.error)}
            </AlertDescription>
          </Alert>
        )}

        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) =>
              value.trim() ? undefined : "Username is required",
          }}
        >
          {(field) => {
            const hasError =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <div className="space-y-2">
                <Label htmlFor="playlist-member-username">Username</Label>
                <Input
                  id="playlist-member-username"
                  name={field.name}
                  type="text"
                  autoComplete="off"
                  placeholder="Enter a username..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    invite.reset();
                    field.handleChange(event.target.value);
                  }}
                  aria-invalid={hasError}
                />
                {hasError && (
                  <p className="text-xs text-destructive">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="accessLevel">
          {(field) => (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Permission level</legend>
              <div className="grid auto-rows-fr grid-cols-1 gap-2.5">
                {ACCESS_OPTIONS.map((option) => {
                  const selected = field.state.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        invite.reset();
                        field.handleChange(option.value);
                      }}
                      className={cn(
                        "flex h-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        selected
                          ? "border-foreground/30 bg-muted/50 ring-1 ring-foreground/20"
                          : "border-border/70 hover:border-border hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md text-xs",
                          selected
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <option.Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                          {selected && (
                            <Check className="size-4 text-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        </form.Field>
      </div>

      <SheetFooter className="shrink-0 flex-row items-center justify-end gap-2.5 border-t p-0 pt-4 sm:space-x-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={invite.isPending}
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
              className="gap-2"
              disabled={submitState !== "ready" || invite.isPending}
            >
              {invite.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span>{invite.isPending ? "Sending..." : "Send invite"}</span>
            </Button>
          )}
        </form.Subscribe>
      </SheetFooter>
    </form>
  );
}

function getInviteErrorMessage(error: unknown) {
  if (!isApiError(error)) return "An unexpected error occurred";

  switch (error.error_code) {
    case "USER_NOT_FOUND":
      return "User not found";
    case "SELF_INVITE":
      return "Cannot invite yourself";
    case "USER_IS_MEMBER":
      return "User is already in this playlist";
    case "INVITE_EXISTS":
      return "You have already invited this user";
    case "INVALID_INVITE":
      return "Invalid invite";
    default:
      return error.message;
  }
}
