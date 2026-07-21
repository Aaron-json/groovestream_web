import React, { useState, useRef, useCallback } from "react";
import { FileAudio, X, Upload, Plus } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { playlistInfoOptions, useUploadAudioFile } from "@/query/media";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 1024 * 1024 * 25; // 25MB
const SUPPORTED_FILE_TYPES = ["mpeg", "mp3", "wav", "flac"];

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

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

function validateFile(file: File) {
  const fileTypeLower = file.type.toLowerCase();
  if (!SUPPORTED_FILE_TYPES.some((type) => fileTypeLower.includes(type))) {
    return { valid: false, error: "Unsupported format" };
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

  const { playlistId } = Route.useParams();
  const { data: playlist } = useSuspenseQuery(playlistInfoOptions(playlistId));

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = [];

      for (const file of newFiles) {
        // TODO: find a better way to check for duplicates
        // if (files.some(existingFile => existingFile.name === file.name)) {
        //   toast.error(`"${file.name}" already selected`);
        //   continue;
        // }

        if (files.length + validFiles.length >= MAX_FILES) {
          toast.error(`Maximum ${MAX_FILES} files allowed`);
          break;
        }

        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`"${file.name}": ${validation.error}`);
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(() => {
    if (!playlist || files.length === 0) return;

    toast("Uploading audio files", {
      description:
        "This may take a while. You can monitor progress from your tasks list",
    });
    void uploadFunc(files, playlist)
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
    navigate({
      to: "/library/playlists/$playlistId",
      params: { playlistId },
    });
  }, [files, playlist, playlistId, uploadFunc, navigate]);

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <FileDropZone onFiles={handleFiles} />
      ) : (
        <FilesList
          files={files}
          onRemove={removeFile}
          onUpload={handleUpload}
          onAddMore={handleFiles}
        />
      )}
    </div>
  );
}

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
}

function FileDropZone({ onFiles }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFiles(files);
      }
    },
    [onFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFiles(Array.from(files));
      }
      e.target.value = "";
    },
    [onFiles],
  );

  return (
    <Card>
      <CardContent>
        <div
          className={cn(
            `
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all`,
            isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : null,
            !isDragOver ? "hover:border-primary/50 hover:bg-primary/5" : null,
          )}
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
            accept={SUPPORTED_FILE_TYPES.map((type) => `audio/${type}`).join(
              ",",
            )}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-4">
            <div
              className={`mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center ${
                isDragOver ? "bg-primary/10" : ""
              }`}
            >
              <Plus
                className={`h-8 w-8 ${isDragOver ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-1">
                {isDragOver ? "Drop files here" : "Upload audio files"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <Button>Browse Files</Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {SUPPORTED_FILE_TYPES.map((t) => t.toUpperCase()).join(", ")} •
              Max {formatBytes(MAX_FILE_SIZE)} each • Up to {MAX_FILES} files
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FilesListProps {
  files: File[];
  onRemove: (index: number) => void;
  onUpload: () => void;
  onAddMore: (files: File[]) => void;
}

function FilesList({ files, onRemove, onUpload, onAddMore }: FilesListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = e.target.files;
      if (newFiles && newFiles.length > 0) {
        onAddMore(Array.from(newFiles));
      }
      e.target.value = "";
    },
    [onAddMore],
  );

  const canAddMore = files.length < MAX_FILES;

  return (
    <div className="w-full space-y-4">
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-medium">Files to upload</h2>
              <span className="text-sm text-muted-foreground">
                ({files.length} of {MAX_FILES})
              </span>
            </div>

            <div className="flex gap-2">
              {canAddMore && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={SUPPORTED_FILE_TYPES.map(
                      (type) => `audio/${type}`,
                    ).join(",")}
                    onChange={handleAddFiles}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button
                onClick={onUpload}
                disabled={files.length === 0}
                size="sm"
                className="w-24"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y max-h-80 overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-4 hover:bg-muted/30"
            >
              <FileAudio className="h-5 w-5 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
