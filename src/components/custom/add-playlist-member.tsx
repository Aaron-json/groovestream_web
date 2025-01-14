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
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { sendPlaylistInvite } from "@/api/requests/media";
import { isAxiosError } from "axios";
import { ResponseError } from "@/types/errors";

type AddPlaylistMemberProps = {
  playlistId: number;
  trigger?: React.ReactNode;
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
      const defaultMessage = "An unexpected error occurred";
      let message = defaultMessage;
      if (isAxiosError<ResponseError>(err)) {
        const errorCode = err.response?.data.error_code;
        if (errorCode === "USER_NOT_FOUND") {
          message = "User not found";
        } else if (errorCode === "USER_ALREADY_IN_PLAYLIST") {
          message = "User already in playlist";
        } else if (errorCode === "INVALID_INVITE") {
        }
      }
      setError("root", {
        message,
      });
    }
  }
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member to Playlist</DialogTitle>
        </DialogHeader>
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
          <Button type="submit" variant="default" form="add-playlist-member">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
