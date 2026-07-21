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
import { useForm } from "react-hook-form";
import {
  sendPlaylistInvite,
} from "@/api/generated/sdk.gen";
import { isApiError, type Playlist } from "@/api/types";
import React, { useState } from "react";

type AddPlaylistMemberProps = {
  playlistId: Playlist["id"];
  trigger?: React.ReactElement;
  open?: boolean; // For controlled mode
  onOpenChange?: (open: boolean) => void; // For controlled mode
  defaultOpen?: boolean; // For uncontrolled mode initial state
};

type AddPlaylistMemberValues = {
  username: string;
};

export default function AddPlaylistMember(props: AddPlaylistMemberProps) {
  const [invitedUsername, setInvitedUsername] = useState<string>();
  const { register, handleSubmit, formState, setError, clearErrors, reset } =
    useForm<AddPlaylistMemberValues>({
      defaultValues: {
        username: "",
      },
    });

  const defaultTrigger = (
    <Button variant="ghost" size="icon">
      <UserRoundPlus className="h-4 w-4" />
    </Button>
  );

  async function onSubmit(data: AddPlaylistMemberValues) {
    try {
      await sendPlaylistInvite({
        body: {
          playlist_id: props.playlistId,
          username: data.username,
        },
      });
      setInvitedUsername(data.username);
      reset();
    } catch (err) {
      let message = "An unexpected error occurred";
      if (isApiError(err)) {
        const errorCode = err.error_code;
        if (errorCode === "USER_NOT_FOUND") {
          message = "User not found";
        } else if (errorCode === "SELF_INVITE") {
          message = "Cannot invite yourself";
        } else if (errorCode === "USER_IS_MEMBER") {
          message = "User is already in this playlist";
        } else if (errorCode === "INVITE_EXISTS") {
          message = "You have already invited this user";
        } else if (errorCode === "INVALID_INVITE") {
          message = "Invalid invite";
        } else {
          message = err.message;
        }
      }
      setError("root", {
        message,
      });
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (props.onOpenChange) {
      props.onOpenChange(open);
    }
    if (!open) {
      // Reset form state when dialog closes
      reset({ username: "" });
      setInvitedUsername(undefined);
      clearErrors();
    }
  };

  const isExternallyControlled = props.open !== undefined;

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleOpenChange}
      defaultOpen={props.defaultOpen}
    >
      {/*
        Render a DialogTrigger only if:
        1. The dialog is NOT externally controlled via the 'open' prop.
        2. In this case, use 'props.trigger' if provided, otherwise use the default button.
        If the dialog IS externally controlled, no trigger is rendered by this component itself.
      */}
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

        {formState.isSubmitSuccessful && !formState.errors.root && (
          <div className="mt-4 flex items-center rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            <Check className="mr-2 h-5 w-5 shrink-0" />
            Invite sent successfully to {invitedUsername}.
          </div>
        )}
        {formState.errors.root?.message && (
          <div className="mt-4 flex items-center rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5 shrink-0" />
            {formState.errors.root.message}
          </div>
        )}

        <form
          id="add-playlist-member"
          onSubmit={handleSubmit(onSubmit)}
          className="py-4"
        >
          <div className="grid flex-1 gap-2">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Username"
              aria-invalid={!!formState.errors.username}
              {...register("username", {
                required: "Username is required",
              })}
            />
            {formState.errors.username && (
              <p className="text-sm text-destructive mt-1">
                {formState.errors.username.message}
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
          <Button
            type="submit"
            variant="default"
            form="add-playlist-member"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
