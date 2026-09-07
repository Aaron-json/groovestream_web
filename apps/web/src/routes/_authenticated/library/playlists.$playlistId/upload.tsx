import {
  useState,
  type ChangeEvent,
  type DragEvent,
  type SubmitEvent,
} from "react";
import { FileAudio, Plus, Upload, X } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { playlistInfoOptions } from "@groovestream/query/media";
import { useUploadAudioFile } from "@/query/media";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatBytes } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(["mp3", "wav", "flac"]);
const SUPPORTED_MIME_TYPES = new Set([
  "audio/flac",
  "audio/mpeg",
  "audio/mp3",
  "audio/vnd.wave",
  "audio/wav",
  "audio/wave",
  "audio/x-flac",
  "audio/x-wav",
]);
const FILE_INPUT_ACCEPT = [
  ".mp3",
  ".wav",
  ".flac",
  ...SUPPORTED_MIME_TYPES,
].join(",");

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/upload",
)({
  component: RouteComponent,
  staticData: {
    crumbs: (params) => [
      { label: "Upload", to: "/library/playlists/$playlistId/upload", params },
    ],
  },
});

function pluralizeTracks(count: number) {
  return count === 1 ? "track" : "tracks";
}

function getFileExtension(filename: string) {
  const separator = filename.lastIndexOf(".");
  return separator === -1 ? "" : filename.slice(separator + 1).toLowerCase();
}

function getFileIdentity(file: File) {
  return `${file.name.normalize()}\0${file.size}\0${file.lastModified}`;
}

type FileValidationResult =
  { file: File; valid: true } | { file: File; valid: false; error: string };

function validateFiles(
  selectedFiles: File[],
  newFiles: File[],
): FileValidationResult[] {
  const identities = new Set(selectedFiles.map(getFileIdentity));
  const results: FileValidationResult[] = [];

  for (const file of newFiles) {
    const identity = getFileIdentity(file);
    const isSupported =
      SUPPORTED_EXTENSIONS.has(getFileExtension(file.name)) ||
      SUPPORTED_MIME_TYPES.has(file.type.toLowerCase());
    let error: string | undefined;
    if (file.size === 0) {
      error = "The file is empty";
    } else if (file.size > MAX_FILE_SIZE) {
      error = `The file is larger than ${formatBytes(MAX_FILE_SIZE)}`;
    } else if (!isSupported) {
      error = "Only MP3, WAV, and FLAC files are supported";
    } else if (identities.has(identity)) {
      error = "This file is already selected";
    }

    if (error) {
      results.push({ file, valid: false, error });
      continue;
    }

    identities.add(identity);
    results.push({ file, valid: true });
  }

  return results;
}

function showFileErrors(errors: string[], rejectedCount: number) {
  const visibleErrors = errors.slice(0, 3);
  if (errors.length > visibleErrors.length) {
    visibleErrors.push(`And ${errors.length - visibleErrors.length} more`);
  }

  toast.error(
    rejectedCount === 1
      ? "File was not added"
      : `${rejectedCount} files were not added`,
    {
      description: visibleErrors.join(" • "),
    },
  );
}

type UseFileDropOptions = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

function useFileDrop({ onFiles, disabled = false }: UseFileDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    if (disabled) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }
    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled && event.dataTransfer.files.length > 0) {
      onFiles(Array.from(event.dataTransfer.files));
    }
  }

  return {
    isDragOver,
    dropProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}

type EmptyDropZoneProps = {
  onFiles: (files: File[]) => void;
};

function EmptyDropZone({ onFiles }: EmptyDropZoneProps) {
  const { isDragOver, dropProps } = useFileDrop({ onFiles });

  return (
    <label
      htmlFor="audio-file-upload"
      {...dropProps}
      className={cn(
        "group m-4 sm:m-6 flex min-h-[260px] sm:min-h-[320px] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors outline-none focus-within:ring-2 focus-within:ring-ring",
        isDragOver
          ? "border-foreground/40 bg-muted/40"
          : "border-border hover:border-foreground/25 hover:bg-muted/30",
      )}
    >
      <FileInput onFiles={onFiles} />
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Upload className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isDragOver
            ? "Drop audio tracks here"
            : "Drag and drop audio tracks here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports MP3, WAV, or FLAC · Up to {formatBytes(MAX_FILE_SIZE)} per
          file · Up to {MAX_FILES} {pluralizeTracks(MAX_FILES)}
        </p>
      </div>
      <span
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none mt-1 gap-1.5 text-xs shadow-xs",
        )}
      >
        <Plus className="size-3.5" />
        Choose files
      </span>
    </label>
  );
}

type SelectedFilesListProps = {
  files: File[];
  onRemove: (identity: string) => void;
  onFiles: (files: File[]) => void;
  remaining: number;
};

function SelectedFilesList({
  files,
  onRemove,
  onFiles,
  remaining,
}: SelectedFilesListProps) {
  const canAddMore = remaining > 0;
  const { isDragOver, dropProps } = useFileDrop({
    onFiles,
    disabled: !canAddMore,
  });

  return (
    <div
      {...dropProps}
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      {isDragOver && canAddMore && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/90 p-6 text-center backdrop-blur-xs transition-all animate-in fade-in-0">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload className="size-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Drop audio tracks to add
          </p>
          <p className="text-xs text-muted-foreground">
            Up to {remaining} more {pluralizeTracks(remaining)} · MP3, WAV, or
            FLAC
          </p>
        </div>
      )}

      <div className="divide-y">
        {files.map((file) => {
          const identity = getFileIdentity(file);
          return (
            <div
              key={identity}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileAudio className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={file.name}
                >
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${file.name}`}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRemove(identity)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {canAddMore && (
        <label
          htmlFor="audio-file-upload"
          className="m-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 px-4 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-muted/30 hover:text-foreground focus-within:ring-2 focus-within:ring-ring"
        >
          <FileInput onFiles={onFiles} />
          <Plus className="size-3.5" />
          <span>
            Drop more tracks here or click to browse ({remaining} remaining)
          </span>
        </label>
      )}
    </div>
  );
}

type FileInputProps = {
  onFiles: (files: File[]) => void;
};

function FileInput({ onFiles }: FileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    if (input.files?.length) {
      onFiles(Array.from(input.files));
    }
    input.value = "";
  }

  return (
    <input
      id="audio-file-upload"
      type="file"
      multiple
      accept={FILE_INPUT_ACCEPT}
      onChange={handleChange}
      className="sr-only"
    />
  );
}

function RouteComponent() {
  const uploadFiles = useUploadAudioFile();

  const { playlistId } = Route.useParams();
  const { data: playlist } = useSuspenseQuery(playlistInfoOptions(playlistId));
  const [files, setFiles] = useState<File[]>([]);

  function addFiles(newFiles: File[]) {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const result of validateFiles(files, newFiles)) {
      if (result.valid) {
        validFiles.push(result.file);
      } else {
        errors.push(`${result.file.name}: ${result.error}`);
      }
    }

    const availableSlots = MAX_FILES - files.length;
    const acceptedFiles = validFiles.slice(0, availableSlots);
    const overflowCount = validFiles.length - acceptedFiles.length;
    if (overflowCount > 0) {
      errors.push(
        `${overflowCount} ${pluralizeTracks(overflowCount)} exceeded the ${MAX_FILES}-track limit`,
      );
    }

    if (acceptedFiles.length > 0) {
      setFiles([...files, ...acceptedFiles]);
    }
    const rejectedCount = newFiles.length - acceptedFiles.length;
    if (rejectedCount > 0) showFileErrors(errors, rejectedCount);
  }

  function removeFile(identity: string) {
    setFiles(files.filter((file) => getFileIdentity(file) !== identity));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) return;

    const submittedFiles = files;
    setFiles([]);
    toast("Uploading audio files", {
      description: "You can monitor processing from the tasks menu.",
    });
    void uploadFiles(submittedFiles, playlist)
      .then(({ failures }) => {
        for (const { file, error } of failures) {
          toast.error(`Error uploading "${file.name}"`, {
            description: error instanceof Error ? error.message : undefined,
          });
        }
      })
      .catch((error) => {
        toast.error("Unexpected upload error", {
          description: error instanceof Error ? error.message : undefined,
        });
      });
  }

  const totalSize = files.reduce((size, file) => size + file.size, 0);
  const hasFiles = files.length > 0;
  const remaining = MAX_FILES - files.length;
  const canAddMore = remaining > 0;

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b">
          <CardTitle>{hasFiles ? "Files to upload" : "Add tracks"}</CardTitle>
          <CardDescription>
            {hasFiles
              ? canAddMore
                ? `Add up to ${remaining} more ${pluralizeTracks(remaining)} below.`
                : `Maximum limit reached (${MAX_FILES} ${pluralizeTracks(MAX_FILES)}).`
              : `Choose up to ${MAX_FILES} ${pluralizeTracks(MAX_FILES)} (MP3, WAV, or FLAC).`}
          </CardDescription>
          {hasFiles && (
            <CardAction className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {files.length}/{MAX_FILES}
              </span>
              {canAddMore && (
                <label
                  htmlFor="audio-file-upload"
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                    }),
                    "cursor-pointer gap-1.5 text-xs",
                  )}
                >
                  <Plus className="size-3.5" />
                  <span className="hidden sm:inline">Add tracks</span>
                </label>
              )}
            </CardAction>
          )}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {!hasFiles ? (
            <EmptyDropZone onFiles={addFiles} />
          ) : (
            <SelectedFilesList
              files={files}
              onRemove={removeFile}
              onFiles={addFiles}
              remaining={remaining}
            />
          )}
        </CardContent>

        {hasFiles && (
          <CardFooter className="shrink-0 flex-col items-stretch justify-between gap-3 border-t bg-muted/40 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {files.length} {pluralizeTracks(files.length)}
              </span>
              <span aria-hidden="true">•</span>
              <span className="font-mono tabular-nums">
                {formatBytes(totalSize)} total
              </span>
              <span aria-hidden="true">•</span>
              <span>
                {canAddMore ? `${remaining} remaining` : "Max limit reached"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
              <Button type="submit" className="gap-2">
                <Upload className="size-4" />
                <span>
                  Upload {files.length} {pluralizeTracks(files.length)}
                </span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </form>
  );
}
