import { useContext, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Audiofile } from "@/api/types/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/media";
import { mediaContext } from "@/contexts/media";
import { toast } from "sonner";
import { Trash2, Search, PlayCircle, PauseCircle, Music2 } from "lucide-react";
import { deleteAudioFile } from "@/api/requests/media";
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
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

type AudiofileTableProps = {
  audiofiles: Audiofile[];
  mediaStoreKey?: string;
  skeleton?: boolean;
  onChange?: () => any;
  refetch?: () => void;
};

const columnHelper = createColumnHelper<Audiofile>();

export default function AudiofileTable(props: AudiofileTableProps) {
  const { audiofiles: data, mediaStoreKey, skeleton = false, refetch } = props;
  const isMobile = useIsMobile();
  const mediaCtx = useContext(mediaContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  if (!mediaCtx) {
    throw new Error(
      "AudiofileTable must be used within a MediaContextProvider",
    );
  }

  const currentAudiofile = mediaCtx.getMedia()?.audiofile;

  const handlePlayTrack = async (index: number) => {
    if (mediaStoreKey) {
      try {
        await mediaCtx.setMedia(mediaStoreKey, index);
      } catch (error: any) {
        toast.error("Error loading media", {
          description: error.message || "Could not play the selected audio.",
        });
      }
    } else {
      toast.error("Playback context error", {
        description: "MediaStoreKey is missing for playback.",
      });
    }
  };

  const handleDeleteAudiofile = async (audiofile: Audiofile) => {
    setIsDeletingId(audiofile.id);
    try {
      await deleteAudioFile(audiofile.id);
      toast.success(`"${audiofile.title || audiofile.filename}" removed.`);
      refetch?.();
    } catch (error: any) {
      toast.error("Error deleting audio file", {
        description: error.message || "Could not remove the audio file.",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "play-index",
        header: () => <div className="w-10 text-center">#</div>,
        size: 60,
        cell: ({ row }: { row: Row<Audiofile> }) => {
          const audiofile = row.original;
          const isCurrentTrack = currentAudiofile?.id === audiofile.id;
          const isPlaying =
            isCurrentTrack && mediaCtx.playbackState === "playing";
          const isHovered = hoveredRowId === String(audiofile.id);

          return (
            <div
              className="flex items-center justify-center h-full w-10 group text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click if this specific element is clicked
                handlePlayTrack(row.index);
              }}
            >
              {isCurrentTrack ? (
                isPlaying ? (
                  <PauseCircle className="h-5 w-5 text-primary cursor-pointer" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-primary cursor-pointer" />
                )
              ) : isHovered ? (
                <PlayCircle className="h-5 w-5 text-foreground cursor-pointer" />
              ) : (
                <span>{row.index + 1}</span>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.title || row.filename, {
        id: "title",
        header: "Title",
        size: 300,
        cell: (info) => (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block truncate font-medium text-foreground">
                  {info.getValue()}
                </span>
              </TooltipTrigger>
              <TooltipContent>{info.getValue()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      }),
      columnHelper.accessor((row) => row.artists?.join(", ") || "Unknown", {
        id: "artist",
        header: "Artist",
        size: 200,
        cell: (info) => (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block truncate text-muted-foreground">
                  {info.getValue()}
                </span>
              </TooltipTrigger>
              <TooltipContent>{info.getValue()}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      }),
      ...(!isMobile
        ? [
            columnHelper.accessor((row) => row.album || "Unknown", {
              id: "album",
              header: "Album",
              size: 200,
              cell: (info) => (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block truncate text-muted-foreground">
                        {info.getValue()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{info.getValue()}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
            }),
          ]
        : []),
      columnHelper.accessor((row) => formatDuration(row.duration), {
        id: "duration",
        header: () => <div className="text-right">Duration</div>,
        size: 100,
        cell: (info) => (
          <div className="text-right text-muted-foreground">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        size: 80,
        cell: ({ row }: { row: Row<Audiofile> }) => (
          <div className="flex items-center justify-end opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Delete ${row.original.title || row.original.filename}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Audio File</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "
                    {row.original.title || row.original.filename}"? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeletingId === row.original.id}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteAudiofile(row.original)}
                    disabled={isDeletingId === row.original.id}
                  >
                    {isDeletingId === row.original.id
                      ? "Deleting..."
                      : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      }),
    ],
    [isMobile, mediaCtx, mediaStoreKey, hoveredRowId, isDeletingId],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    // Enable row hover state if needed for other effects, though CSS handles much of it
    // meta: {
    //   hoveredRowId,
    //   setHoveredRowId,
    // },
  });

  const columnCount =
    table.getHeaderGroups()[0]?.headers.length || columns.length;

  if (skeleton) {
    const SKELETON_COLUMNS = [
      60,
      null,
      200,
      isMobile ? 0 : 200,
      100,
      80,
    ].filter((s) => s !== 0); // Approximate widths, null for flex-1
    return (
      <div className="rounded-md border animate-pulse">
        <div className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-10 w-full max-w-xs rounded-md" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {SKELETON_COLUMNS.map((width, i) => (
                <TableHead
                  key={i}
                  style={width ? { width: `${width}px` } : { flex: 1 }}
                >
                  <Skeleton className="h-5 w-3/4 rounded" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {SKELETON_COLUMNS.map((width, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    style={width ? { width: `${width}px` } : {}}
                  >
                    {cellIndex === 0 ? (
                      <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                    ) : (
                      <Skeleton className="h-5 w-full rounded" />
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

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-card">
        <div className="flex items-center p-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tracks, artists, albums..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 border-0 border-b rounded-none focus-visible:border-primary"
              aria-label="Search audio files"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.getSize() !== 150
                          ? `${header.getSize()}px`
                          : undefined,
                    }} // 150 is TanStack default
                    className="py-3 px-2 first:px-4 last:px-4"
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
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-36 text-center text-muted-foreground"
                >
                  {globalFilter ? (
                    "No results found for your search."
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Music2 className="w-12 h-12" />
                      <span>No tracks in this list.</span>
                    </div>
                  )}
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
                      // Allow click only if not interacting with a button/interactive element within the row
                      if (
                        !(e.target as HTMLElement).closest(
                          'button, [role="button"], a, input',
                        )
                      ) {
                        handlePlayTrack(row.index);
                      }
                    }}
                    onMouseEnter={() => setHoveredRowId(String(audiofile.id))}
                    onMouseLeave={() => setHoveredRowId(null)}
                    className={`group/row cursor-pointer transition-colors ${
                      isCurrentTrack
                        ? "bg-primary/10 hover:bg-primary/20 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                    data-state={isCurrentTrack ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-2.5 px-2 first:px-4 last:px-4 align-middle"
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
    </TooltipProvider>
  );
}
