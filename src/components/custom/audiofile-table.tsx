import { useState, useMemo, useCallback, useDeferredValue } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  Row,
} from "@tanstack/react-table";
import { Trash2, Search, Play, Pause, Music2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

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
};

const columnHelper = createColumnHelper<Audiofile>();

export default function AudiofileTable({
  audiofiles,
  storeKey,
  queryKey,
  skeleton = false,
  onChange,
  refetch,
}: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredFilter = useDeferredValue(globalFilter);
  const deleteAudioFile = useDeleteAudioFile();

  const { media, setMedia, playbackState, playPauseToggle } = useMediaStore(
    useShallow((state) => ({
      media: state.media,
      setMedia: state.setMedia,
      playbackState: state.playbackState,
      playPauseToggle: state.playPauseToggle,
    })),
  );

  const currentAudiofile = media?.audiofile;

  const handlePlayTrack = useCallback(
    async (index: number, audiofile: Audiofile) => {
      try {
        if (currentAudiofile?.id === audiofile.id) {
          playPauseToggle();
        } else {
          await setMedia(storeKey, queryKey, index);
        }
      } catch (error: any) {
        toast.error("Playback Error", {
          description: error?.message || "Unable to play the selected track",
        });
      }
    },
    [currentAudiofile, playPauseToggle, setMedia, storeKey, queryKey],
  );

  const handleDeleteTrack = useCallback(
    async (audiofile: Audiofile) => {
      try {
        await deleteAudioFile(audiofile);
        onChange?.();
        refetch?.();
        toast.success("Track deleted successfully");
      } catch (error: any) {
        toast.error("Delete Error", {
          description: error?.message || "Failed to delete track",
        });
      }
    },
    [deleteAudioFile, onChange, refetch],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "play-index",
        header: () => <div className="w-10 text-center">#</div>,
        cell: ({ row }: { row: Row<Audiofile> }) => {
          const audiofile = row.original;
          const isCurrentTrack = currentAudiofile?.id === audiofile.id;
          const isPlaying = isCurrentTrack && playbackState === "playing";

          return (
            <div
              className="relative flex items-center justify-center h-full w-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayTrack(row.index, audiofile);
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
                  <span className="text-sm text-muted-foreground group-hover/row:opacity-0 transition-opacity">
                    {row.index + 1}
                  </span>
                  <Play className="absolute h-4 w-4 text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity" />
                </>
              )}
            </div>
          );
        },
      }),

      columnHelper.accessor((row) => row.title || row.filename, {
        id: "title",
        header: "Title",
        cell: (info) => {
          const title = info.getValue();
          return (
            <TooltipProvider delayDuration={500}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate font-medium text-foreground cursor-default">
                    {title}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words">{title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      }),

      columnHelper.accessor(
        (row) => row.artists?.join(", ") || "Unknown Artist",
        {
          id: "artist",
          header: "Artist",
          cell: (info) => {
            const artist = info.getValue();
            return (
              <TooltipProvider delayDuration={500}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate text-muted-foreground cursor-default">
                      {artist}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="break-words">{artist}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          },
        },
      ),

      ...(!isMobile
        ? [
            columnHelper.accessor((row) => row.album || "Unknown Album", {
              id: "album",
              header: "Album",
              cell: (info) => {
                const album = info.getValue();
                return (
                  <TooltipProvider delayDuration={500}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate text-muted-foreground cursor-default">
                          {album}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="break-words">{album}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              },
            }),
          ]
        : []),

      columnHelper.accessor((row) => formatDuration(row.duration), {
        id: "duration",
        header: () => (
          <div className="flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            <span>Duration</span>
          </div>
        ),
        cell: (info) => (
          <div className="text-right text-muted-foreground font-mono text-sm">
            {info.getValue()}
          </div>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }: { row: Row<Audiofile> }) => {
          const audiofile = row.original;
          const trackTitle = audiofile.title || audiofile.filename;

          return (
            <div className="flex items-center justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Delete ${trackTitle}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{" "}
                      <strong>"{trackTitle}"</strong>? This action cannot be
                      undone and the file will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
                      onClick={() => handleDeleteTrack(audiofile)}
                    >
                      Delete File
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      }),
    ],
    [
      isMobile,
      currentAudiofile,
      playbackState,
      handlePlayTrack,
      handleDeleteTrack,
    ],
  );

  const table = useReactTable({
    data: audiofiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter: deferredFilter },
    onGlobalFilterChange: setGlobalFilter,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  const columnCount = columns.length;

  if (skeleton) {
    return <AudiofileTableSkeleton isMobile={isMobile} />;
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card shadow-sm">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks, artists, albums..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 bg-background border-input focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:bg-accent/10 transition-colors"
              aria-label="Search audio files"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} tracks
          </div>
        </div>

        {/* Table */}
        <div className="relative overflow-hidden min-w-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-12 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow className="hover:bg-transparent min-w-0">
                  <TableCell
                    colSpan={columnCount}
                    className="h-40 text-center min-w-0"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <Music2 className="h-10 w-10" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {globalFilter
                            ? "No results found"
                            : "No tracks available"}
                        </p>
                        <p className="text-sm">
                          {globalFilter
                            ? "Try adjusting your search terms"
                            : "Upload some audio files to get started"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const audiofile = row.original;
                  const isCurrentTrack = currentAudiofile?.id === audiofile.id;

                  return (
                    <TableRow
                      key={audiofile.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest(
                            'button, [role="button"], a, input, [role="dialog"]',
                          )
                        ) {
                          handlePlayTrack(row.index, audiofile);
                        }
                      }}
                      className={`group/row cursor-pointer transition-colors border-b border-border/50 odd:bg-muted/20 ${
                        isCurrentTrack
                          ? "bg-accent/40 hover:bg-accent/60"
                          : "hover:bg-muted/30"
                      }`}
                      data-state={isCurrentTrack ? "selected" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="h-14 px-4 py-2 align-middle"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}

function AudiofileTableSkeleton({ isMobile }: { isMobile: boolean }) {
  const skeletonColumns = [50, null, 200, isMobile ? 0 : 200, 100, 60].filter(
    (w) => w !== 0,
  );

  return (
    <div className="rounded-lg border bg-card shadow-sm animate-pulse">
      {/* Search Header Skeleton */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Table Skeleton */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            {skeletonColumns.map((width, i) => (
              <TableHead
                key={i}
                style={width ? { width: `${width}px` } : { flex: 1 }}
                className="h-12 px-4"
              >
                <Skeleton className="h-3 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }, (_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="hover:bg-transparent border-b border-border/50"
            >
              {skeletonColumns.map((width, cellIndex) => (
                <TableCell
                  key={cellIndex}
                  style={width ? { width: `${width}px` } : {}}
                  className="h-14 px-4 py-2"
                >
                  {cellIndex === 0 ? (
                    <div className="flex justify-center">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  ) : cellIndex === skeletonColumns.length - 2 ? (
                    <div className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                  ) : cellIndex === skeletonColumns.length - 1 ? (
                    <div className="flex justify-end">
                      <Skeleton className="h-6 w-6" />
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-full max-w-[200px]" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
