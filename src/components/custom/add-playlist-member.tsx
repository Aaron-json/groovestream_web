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
import { sendPlaylistInvite } from "@/api/requests/media";
import { isAxiosError } from "axios";
import { ResponseError } from "@/api/types/errors";
import React from "react";
import { Playlist } from "@/api/types/media";

type AddPlaylistMemberProps = {
  playlistId: Playlist["id"];
  trigger?: React.ReactNode;
  open?: boolean; // For controlled mode
  onOpenChange?: (open: boolean) => void; // For controlled mode
  defaultOpen?: boolean; // For uncontrolled mode initial state
};

type AddPlaylistMemberValues = {
  username: string;
};

export default function AddPlaylistMember(props: AddPlaylistMemberProps) {
  const { register, handleSubmit, formState, setError, reset } =
    useForm<AddPlaylistMemberValues>({
      defaultValues: {
        username: "",
      },
    });

  const defaultInternalTrigger = (
    <Button variant="ghost" size="icon">
      <UserRoundPlus className="h-4 w-4" />
    </Button>
  );

  async function onSubmit(data: AddPlaylistMemberValues) {
    try {
      await sendPlaylistInvite(props.playlistId, data.username);
      reset();
    } catch (err) {
      let message = "An unexpected error occurred";
      if (isAxiosError<ResponseError>(err)) {
        const errorCode = err.response?.data.error_code;
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
      setError("root", { message: undefined });
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
        <DialogTrigger asChild>
          {props.trigger !== undefined ? props.trigger : defaultInternalTrigger}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Playlist</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the username of the person you want to add to the playlist.
        </DialogDescription>

        {formState.isSubmitSuccessful && !formState.errors.root && (
          <div className="mt-4 flex items-center rounded-md border border-green-500 bg-green-50 p-3 text-sm text-green-700">
            <Check className="mr-2 h-5 w-5 flex-shrink-0" />
            Invite sent successfully to{" "}
            {formState.defaultValues?.username || "user"}.
          </div>
        )}
        {formState.errors.root?.message && (
          <div className="mt-4 flex items-center rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
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
              {...register("username", {
                required: "Username is required",
              })}
            />
            {formState.errors.username && (
              <p className="text-sm text-red-600 mt-1">
                {formState.errors.username.message}
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Close</Button>
          </DialogClose>
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
