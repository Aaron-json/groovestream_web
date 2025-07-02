import React, { useState, useRef, useCallback } from "react";
import { FileAudio, X, Trash2, CloudUpload } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { usePlaylistInfo, useUploadAudioFile } from "@/hooks/media";
import { toast } from "sonner";
import InfoCard from "@/components/custom/info-card";
import { useIsMobile } from "@/hooks/use-mobile";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 1024 * 1024 * 20; // 20MB
const SUPPORTED_FILE_TYPES = ["mpeg", "mp3", "wav", "flac"];

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/upload",
)({
  component: RouteComponent,
});

type ValidationResult = {
  valid: boolean;
  error?: string;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

function validateFile(file: File): ValidationResult {
  const fileTypeLower = file.type.toLowerCase();
  if (!SUPPORTED_FILE_TYPES.some((type) => fileTypeLower.includes(type))) {
    return {
      valid: false,
      error: `Unsupported format`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large (max ${formatBytes(MAX_FILE_SIZE)})`,
    };
  }
  return { valid: true };
}

export default function RouteComponent() {
  const [files, setFiles] = useState<File[]>([]);
  const uploadFunc = useUploadAudioFile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { playlistId } = Route.useParams();
  const { data: playlist } = usePlaylistInfo(playlistId);

  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast(`Invalid file "${file.name}"`, {
            description: validation.error,
          });
          continue;
        }
        validFiles.push(file);
      }
      setFiles((prev) => [...prev, ...validFiles]);
    },
    [setFiles],
  );

  const handleUpload = useCallback(async () => {
    if (!playlist) {
      toast("Failed to fetch playlist information");
      return;
    }
    uploadFunc(files, playlist);

    navigate({
      to: "/library/playlists/$playlistId",
      from: Route.fullPath,
      params: {
        playlistId: playlistId,
      },
    });
  }, [files, setFiles, playlist, playlistId]);

  return (
    <section>
      <div>
        {files.length <= 0 && !isMobile ? (
          <InputArea
            selectedFiles={files}
            limit={MAX_FILES}
            handleFiles={handleFiles}
          />
        ) : (
          <SelectedFilesList
            selectedFiles={files}
            setSelectedFiles={setFiles}
            handleUpload={handleUpload}
          />
        )}
      </div>
    </section>
  );
}

type SelectedFilesListProps = {
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleUpload: (files: File[]) => any;
};

function SelectedFilesList({
  selectedFiles,
  setSelectedFiles,
  handleUpload,
}: SelectedFilesListProps) {
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, index2) => index !== index2));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b flex items-center">
        <div className="flex-1 flex">
          <Button onClick={() => handleUpload(selectedFiles)}>
            <CloudUpload />
            Upload
          </Button>
        </div>
        <div className="flex-1 flex justify-center">
          <span>Upload Files</span>
        </div>
        <div className="flex-1 flex justify-end">
          <Button variant="destructive" onClick={() => setSelectedFiles([])}>
            <Trash2 />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-2">
        {selectedFiles.length === 0 ? (
          <InfoCard text="No files selected. Choose files to see them here" />
        ) : (
          <div className="h-full overflow-y-auto">
            {selectedFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded border transition-all hover:bg-primary/10"
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <FileAudio className="aspect-square w-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-foreground truncate text-sm"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                </div>

                <Button onClick={() => removeFile(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type InputAreaProps = {
  selectedFiles: File[];
  limit: number;
  handleFiles: (file: File[]) => any;
};

function InputArea({ selectedFiles, limit, handleFiles }: InputAreaProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = selectedFiles.length < limit;

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(Array.from(files));
      }
    },
    [handleFiles],
  );

  return (
    <div
      className={`w-full bg-muted border-2 rounded-lg border-dashed transition-all duration-300 ease-out
                ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_FILE_TYPES.map((type) => `audio/${type}`).join(",")}
        onChange={(e) => {
          handleFiles(Array.from(e.target.files!));
          e.target.value = "";
          e.currentTarget.value = "";
        }}
        className="hidden"
        disabled={!canAddMore}
      />

      <div className="flex flex-col items-center justify-center p-8 gap-2">
        <CloudUpload
          className={`w-12 h-12 ${
            isDragOver
              ? "text-primary"
              : canAddMore
                ? "text-foreground"
                : "text-muted-foreground"
          }`}
        />

        <h3 className="text-xl font-semibold text-foreground text-center">
          {canAddMore
            ? isDragOver
              ? "Drop files here"
              : "Drag & drop audio files"
            : "File limit reached"}
        </h3>

        <span className="text-muted-foreground text-center">
          or click to browse from your device
        </span>

        <Button>Browse Files</Button>

        <p className="text-muted-foreground">
          Upload up to {MAX_FILES} audio files •{" "}
          {SUPPORTED_FILE_TYPES.map((t) => t.toUpperCase()).join(", ")} • Max{" "}
          {formatBytes(MAX_FILE_SIZE)} each
        </p>
      </div>
    </div>
  );
}
