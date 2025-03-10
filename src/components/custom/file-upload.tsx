import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import React from "react";
import { FormState } from "@/global/types";
import { useUploadAudioFile } from "@/hooks/media";
import { Playlist } from "@/api/types/media";

type FileUploadProps = {
  trigger?: React.ReactNode;
  playlist: Playlist;
  onSuccess?: () => void;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 1024 * 1024 * 20; // 20MB
const SUPPORTED_FILE_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/flac",
];

export default function FileUpload(props: FileUploadProps) {
  const [formState, setFormState] = React.useState<FormState>({
    state: "input",
  });
  const uploadFunc = useUploadAudioFile();
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
        setFormState({
          state: "input",
          message: `File "${file.name}" is not a supported type`,
        });
        return;
      }
    }
    await uploadFunc(files, props.playlist); // captures all erros internally
    setFormState({ state: "input" });
    props.onSuccess?.();
    if (e.currentTarget) {
      e.currentTarget.value = "";
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <span>Upload audio files to your library.</span>
          <br />
          <span>Supported formats: MP3, WAV, FLAC.</span>
          <br />
          <span>Limits: 20MB per file. 5 files at a time.</span>
        </DialogDescription>
        {(formState.state === "input" || formState.state === "error") && (
          <span className="text-sm text-destructive">{formState.message}</span>
        )}
        {formState.state === "loading" && (
          <span className="text-sm text-muted-foreground">Uploading...</span>
        )}
        <Input multiple type="file" onInput={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
