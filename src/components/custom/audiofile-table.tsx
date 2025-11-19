import {
  useState,
  useCallback,
  useDeferredValue,
  useRef,
  useMemo,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Trash2,
  Search,
  Play,
  Pause,
  Music2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Audiofile } from "@/api/types/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/media";
import { MediaQueryKey, useDeleteAudioFile } from "@/hooks/media";
import { useMediaStore } from "@/lib/media";

type AudiofileTableProps = {
  audiofiles: Audiofile[];
  storeKey: string;
  queryKey: MediaQueryKey;
  skeleton?: boolean;
  onChange?: () => void;
  refetch?: () => void;
  className?: string;
  showSearch?: boolean;
  showCount?: boolean;
};

const PlaybackCell = ({
  audiofile,
  index,
  onPlay,
}: {
  audiofile: Audiofile;
  index: number;
  onPlay: (index: number, file: Audiofile) => void;
}) => {
  const { media, playbackState } = useMediaStore(
    useShallow((state) => ({
      media: state.media,
      playbackState: state.playbackState,
    })),
  );

  const isCurrentTrack = media?.audiofile?.id === audiofile.id;
  const isPlaying = isCurrentTrack && playbackState === "playing";

  return (
    <div
      className="relative flex items-center justify-center h-full w-10 cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onPlay(index, audiofile);
      }}
    >
      {isCurrentTrack ? (
        isPlaying ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <Play className="h-4 w-4 text-primary" />
        )
      ) : (
        <>
          <span className="text-sm text-muted-foreground group-hover:opacity-0 transition-opacity">
            {index + 1}
          </span>
          <Play className="absolute h-4 w-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
      )}
    </div>
  );
};

export default function AudiofileTable({
  audiofiles,
  storeKey,
  queryKey,
  skeleton = false,
  onChange,
  refetch,
  className = "",
  showSearch = true,
  showCount = true,
}: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const deleteAudioFile = useDeleteAudioFile();
  const parentRef = useRef<HTMLDivElement>(null);

  const { media, setMedia, playPauseToggle } = useMediaStore(
    useShallow((state) => ({
      media: state.media,
      setMedia: state.setMedia,
      playPauseToggle: state.playPauseToggle,
    })),
  );

  const handlePlayTrack = useCallback(
    async (index: number, audiofile: Audiofile) => {
      try {
        if (media?.audiofile?.id === audiofile.id) {
          playPauseToggle();
        } else {
          await setMedia(storeKey, queryKey, index);
        }
      } catch (error: any) {
        toast.error("Playback Error", {
          description: error?.message || "Unable to play track",
        });
      }
    },
    [media, playPauseToggle, setMedia, storeKey, queryKey],
  );

  const handleDeleteTrack = useCallback(
    async (audiofile: Audiofile) => {
      try {
        await deleteAudioFile(audiofile);
        onChange?.();
        refetch?.();
        toast.success("Track deleted");
      } catch (error: any) {
        toast.error("Delete Error", {
          description: error?.message || "Failed to delete track",
        });
      }
    },
    [deleteAudioFile, onChange, refetch],
  );

  const filteredData = useMemo(() => {
    if (!deferredFilter) return audiofiles;
    const filter = deferredFilter.toLowerCase();
    return audiofiles.filter(
      (file) =>
        file.title?.toLowerCase().includes(filter) ||
        file.filename?.toLowerCase().includes(filter) ||
        file.artists?.some((artist) => artist.toLowerCase().includes(filter)) ||
        file.album?.toLowerCase().includes(filter),
    );
  }, [audiofiles, deferredFilter]);

  const rows = filteredData;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isMobile ? 72 : 56),
    overscan: 5,
  });

  if (skeleton) {
    return <AudiofileTableSkeleton isMobile={isMobile} className={className} />;
  }

  return (
    <TooltipProvider>
      <div
        className={`flex flex-col w-full rounded-lg border bg-card ${className}`}
      >
        {showSearch && (
          <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks, artists..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            {showCount && (
              <div className="text-sm text-muted-foreground hidden sm:block">
                {rows.length} tracks
              </div>
            )}
          </div>
        )}

        {!isMobile && rows.length > 0 && (
          <div className="flex items-center px-4 h-10 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="w-12 text-center">#</div>
            <div className="flex-1 px-2">Title</div>
            <div className="flex-1 px-2">Artist</div>
            <div className="flex-1 px-2">Album</div>
            <div className="w-20 text-right px-2">Duration</div>
            <div className="w-12"></div>
          </div>
        )}

        <div ref={parentRef} className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <EmptyState globalFilter={globalFilter} />
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const audiofile = rows[virtualRow.index];
                const isCurrentTrack = media?.audiofile?.id === audiofile.id;

                return (
                  <div
                    key={audiofile.id || virtualRow.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isMobile ? (
                      <div
                        className={`flex items-center gap-3 px-4 py-2 h-full border-b transition-colors ${
                          isCurrentTrack ? "bg-accent/40" : "active:bg-muted/50"
                        }`}
                        onClick={() =>
                          handlePlayTrack(virtualRow.index, audiofile)
                        }
                      >
                        <div className="flex-shrink-0">
                          <PlaybackCell
                            audiofile={audiofile}
                            index={virtualRow.index}
                            onPlay={handlePlayTrack}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p
                            className={`truncate font-medium text-sm ${isCurrentTrack ? "text-primary" : "text-foreground"}`}
                          >
                            {audiofile.title || audiofile.filename}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {audiofile.artists?.join(", ") || "Unknown Artist"}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrack(audiofile);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center h-full border-b px-4 text-sm transition-colors cursor-pointer group ${
                          isCurrentTrack ? "bg-accent/40" : "hover:bg-muted/30"
                        }`}
                        onClick={() =>
                          handlePlayTrack(virtualRow.index, audiofile)
                        }
                      >
                        <div className="w-12 flex justify-center">
                          <PlaybackCell
                            audiofile={audiofile}
                            index={virtualRow.index}
                            onPlay={handlePlayTrack}
                          />
                        </div>

                        <div className="flex-1 px-2 min-w-0">
                          <div
                            className={`truncate font-medium ${isCurrentTrack ? "text-primary" : "text-foreground"}`}
                          >
                            {audiofile.title || audiofile.filename}
                          </div>
                        </div>

                        <div className="flex-1 px-2 min-w-0">
                          <div className="truncate text-muted-foreground">
                            {audiofile.artists?.join(", ") || "Unknown"}
                          </div>
                        </div>

                        <div className="flex-1 px-2 min-w-0">
                          <div className="truncate text-muted-foreground">
                            {audiofile.album || "-"}
                          </div>
                        </div>

                        <div className="w-20 px-2 text-right font-mono text-muted-foreground">
                          {formatDuration(audiofile.duration)}
                        </div>

                        <div className="w-12 flex justify-end">
                          <DeleteDialog
                            audiofile={audiofile}
                            onConfirm={() => handleDeleteTrack(audiofile)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

function DeleteDialog({
  audiofile,
  onConfirm,
}: {
  audiofile: Audiofile;
  onConfirm: () => void;
}) {
  const trackTitle = audiofile.title || audiofile.filename;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{trackTitle}"</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            Delete File
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState({ globalFilter }: { globalFilter: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-muted-foreground p-10 min-h-[200px]">
      <Music2 className="h-10 w-10 mb-4 opacity-20" />
      <p className="font-medium">
        {globalFilter ? "No results found" : "No tracks available"}
      </p>
    </div>
  );
}

function AudiofileTableSkeleton({
  isMobile,
  className = "",
}: {
  isMobile: boolean;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-lg border bg-card animate-pulse ${className}`}
    >
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            {!isMobile && <Skeleton className="h-4 w-20" />}
          </div>
        ))}
      </div>
    </div>
  );
}
