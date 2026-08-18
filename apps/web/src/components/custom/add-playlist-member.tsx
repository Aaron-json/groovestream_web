import { Button } from "../ui/button";
import { Check, UserRoundPlus, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { sendPlaylistInvite } from "@groovestream/api/sdk";
import { isApiError } from "@groovestream/api/errors";
import type { Playlist } from "@groovestream/api/models";
import type { ReactElement } from "react";

type AddPlaylistMemberProps = {
  playlistId: Playlist["id"];
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export default function AddPlaylistMember(props: AddPlaylistMemberProps) {
  const invite = useMutation({
    mutationFn: (username: string) =>
      sendPlaylistInvite({
        body: {
          playlist_id: props.playlistId,
          username,
        },
      }),
  });
  const form = useForm({
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await invite.mutateAsync(value.username.trim());
      formApi.reset();
    },
  });

  const submit = () => {
    void form.handleSubmit().catch(() => {
      // The mutation state below owns submit errors.
    });
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <UserRoundPlus className="h-4 w-4" />
    </Button>
  );

  const handleOpenChange = (open: boolean) => {
    props.onOpenChange?.(open);
    if (!open) {
      form.reset();
      invite.reset();
    }
  };

  const isExternallyControlled = props.open !== undefined;

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleOpenChange}
      defaultOpen={props.defaultOpen}
    >
      {!isExternallyControlled && (
        <DialogTrigger
          render={props.trigger !== undefined ? props.trigger : defaultTrigger}
        />
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Playlist</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the username of the person you want to add to the playlist.
        </DialogDescription>

        {invite.isSuccess && (
          <div className="mt-4 flex items-center rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <Check className="mr-2 h-5 w-5 shrink-0" />
            Invite sent successfully to {invite.variables}.
          </div>
        )}
        {invite.isError && (
          <div className="mt-4 flex items-center rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
            {getInviteErrorMessage(invite.error)}
          </div>
        )}

        <form
          id="add-playlist-member"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="py-4"
        >
          <div className="grid flex-1 gap-2">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Username is required",
              }}
            >
              {(field) => (
                <>
                  <Input
                    id="username"
                    name={field.name}
                    type="text"
                    placeholder="Username"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      invite.reset();
                      field.handleChange(event.target.value);
                    }}
                    aria-invalid={!field.state.meta.isValid}
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-sm text-destructive mt-1">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </>
              )}
            </form.Field>
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
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
                form="add-playlist-member"
                disabled={submitState !== "ready"}
              >
                {submitState === "submitting" ? "Adding..." : "Add"}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
