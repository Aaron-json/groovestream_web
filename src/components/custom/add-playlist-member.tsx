import { Button } from "../ui/button";
import { Check, UserRoundPlus } from "lucide-react";
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
import { toast } from "sonner";

type AddPlaylistMemberProps = {
  playlistId: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

type AddPlaylistMemberValues = {
  username: string;
};

export default function AddPlaylistMember(props: AddPlaylistMemberProps) {
  const { register, handleSubmit, formState, setError } =
    useForm<AddPlaylistMemberValues>({
      defaultValues: {
        username: "",
      },
    });
  const trigger = props.trigger || (
    <Button variant="ghost" size="icon">
      <UserRoundPlus className="h-4 w-4" />
    </Button>
  );
  async function onSubmit(data: AddPlaylistMemberValues) {
    try {
      // use await so the error is caught
      await sendPlaylistInvite(props.playlistId, data.username);
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
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      defaultOpen={props.defaultOpen}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Playlist</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the username of the person you want to add to the playlist.
        </DialogDescription>
        {formState.isSubmitSuccessful && (
          <div className="flex items-center rounded-md border p-2">
            <Check className="mr-2 h-5 w-5" />
            <span className="text-sm">Invite sent successfully</span>
          </div>
        )}
        {formState.errors.root && (
          <div className="flex items-center rounded-md border-destructive/50 bg-destructive/10 p-2">
            <span className="text-sm">{formState.errors.root.message}</span>
          </div>
        )}
        <form id="add-playlist-member" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <label htmlFor="username">Username</label>
              <Input
                id="username"
                type="text"
                className="input input-bordered"
                {...register("username", {
                  required: "Username is required",
                })}
              />
            </div>
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
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
