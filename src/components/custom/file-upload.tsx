import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import React from "react";
import { uploadAudioFile } from "@/api/requests/media";
import { FormState } from "@/types/formstate";

type FileUploadProps = {
  trigger?: React.ReactNode;
  multiple?: boolean;
  playlistId: number;
  onSuccess?: () => void;
};

const MAX_FILES = 10;
const MAX_FILE_SIZE = 1024 * 1024 * 20; // 20MB
const SUPPORTED_FILE_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav"];

export default function FileUpload(props: FileUploadProps) {
  const [formState, setFormState] = React.useState<FormState>({
    state: "input",
  });
  const trigger = props.trigger || (
    <Button variant="ghost" size="icon">
      <Upload className="h-4 w-4" />
    </Button>
  );
  const handleSubmit: React.FormEventHandler<HTMLInputElement> = async (e) => {
    setFormState({ state: "loading" });
    const files = e.currentTarget.files;
    if (!files || files.length === 0) {
      setFormState({ state: "input", message: "No files selected" });
      return;
    }

    try {
      if (files.length > MAX_FILES) {
        setFormState({
          state: "input",
          message: `You can only upload ${MAX_FILES} files at a time`,
        });
        return;
      }

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          setFormState({
            state: "input",
            message: `File "${file.name}" exceeds size limit`,
          });
          return;
        }
        if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
          console.log(file.type);
          setFormState({
            state: "input",
            message: `File "${file.name}" is not an audio file`,
          });
          return;
        }
      }
      await uploadAudioFile(files, props.playlistId);
      setFormState({ state: "successful" });
      props.onSuccess?.();
    } catch (err: any) {
      console.log(err);
      const message = err.message ?? "An unexpected error occurred.";
      setFormState({ state: "error", message });
    } finally {
      console.log("finally");
      console.log(e.currentTarget);
      e.currentTarget.value = "";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload audio files</DialogTitle>
        </DialogHeader>
        {(formState.state === "input" || formState.state === "error") && (
          <span className="text-sm text-destructive">{formState.message}</span>
        )}
        {formState.state === "loading" && (
          <span className="text-sm text-muted-foreground">Uploading...</span>
        )}
        {formState.state === "successful" && (
          <span className="text-sm text-success/50">Upload successful</span>
        )}
        <Input multiple type="file" accept="audio/*" onInput={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
