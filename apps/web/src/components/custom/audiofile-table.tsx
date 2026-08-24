import { useState, useCallback, useRef, useMemo, memo } from "react";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createColumnHelper,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  tableFeatures,
  useTable,
  type ReactTable,
  type Row,
} from "@tanstack/react-table";
import { Trash2, Play, Pause, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Audiofile } from "@groovestream/api/models";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@groovestream/media/duration";
import { useDeleteAudiofile } from "@/query/media";
import type { AudioSource } from "@groovestream/media/source";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { cn } from "@/lib/utils";
import {
  InfiniteScrollTrigger,
  type PaginationState,
} from "@/components/custom/infinite-list";

const audiofileTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnMeta: metaHelper<{ className?: string }>(),
});

type AudiofileTableFeatures = typeof audiofileTableFeatures;
type AudiofileTableInstance = ReactTable<AudiofileTableFeatures, Audiofile>;
type AudiofileTableRow = Row<AudiofileTableFeatures, Audiofile>;

const columnHelper = createColumnHelper<AudiofileTableFeatures, Audiofile>();

// Keep these in sync with the h-12 rows and h-10 desktop header below.
const ROW_HEIGHT = 48;
const DESKTOP_HEADER_HEIGHT = 40;

function getAudiofileRowId(audiofile: Audiofile) {
  return audiofile.id;
}

type AudiofileTableProps = {
  audiofiles: Audiofile[];
  audiofileSource: AudioSource;
  pagination?: PaginationState;
};

function AudiofileTable({
  audiofiles,
  audiofileSource,
  pagination,
}: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const { mutate: deleteAudiofile } = useDeleteAudiofile();
  const containerRef = useRef<HTMLDivElement>(null);

  const { media, setMedia, playPauseToggle, playbackState } =
    usePlaybackStore(
      useShallow((state) => ({
        media: state.playerState.currentMedia,
        setMedia: state.setMedia,
        playPauseToggle: state.playPauseToggle,
        playbackState: state.playerState.status,
      })),
    );

  const handlePlay = useCallback(
    (file: Audiofile, index: number) => {
      if (media?.audiofile?.id === file.id) {
        void playPauseToggle().catch((error) => {
          toast.error("Playback Error", {
            description: error instanceof Error ? error.message : undefined,
          });
        });
      } else {
        setMedia({ source: audiofileSource, index, audiofile: file }).catch(
          (error) => {
            toast.error("Playback Error", {
              description: error instanceof Error ? error.message : undefined,
            });
          },
        );
      }
    },
    [audiofileSource, media?.audiofile?.id, playPauseToggle, setMedia],
  );

  const handleDelete = useCallback(
    (audio: Audiofile) => {
      deleteAudiofile(audio, {
        onSuccess: () => {
          const { playerState, unloadMedia } = usePlaybackStore.getState();
          const currentMedia = playerState.currentMedia;
          if (currentMedia?.audiofile.id === audio.id) unloadMedia();
          toast.success("Audio file deleted successfully");
        },
        onError: () =>
          toast.error(`Error deleting audio file "${audio.filename}"`),
      });
    },
    [deleteAudiofile],
  );

  const columns = useMemo(
    () =>
      isMobile
        ? getMobileColumns(handleDelete, media?.audiofile?.id, playbackState)
        : getDesktopColumns(handleDelete, media?.audiofile?.id, playbackState),
    [isMobile, handleDelete, media?.audiofile?.id, playbackState],
  );

  const table = useTable({
    features: audiofileTableFeatures,
    data: audiofiles,
    columns,
    getRowId: getAudiofileRowId,
    globalFilterFn: "includesString",
  });

  const { rows } = table.getRowModel();
  const getItemKey = useCallback((index: number) => rows[index].id, [rows]);
  const scrollMargin = isMobile ? 0 : DESKTOP_HEADER_HEIGHT;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey,
    scrollMargin,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const canSearch = pagination?.hasMore !== true;
  const search =
    typeof table.state.globalFilter === "string"
      ? table.state.globalFilter
      : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {canSearch && audiofiles.length > 0 && (
        <div className="shrink-0 border-b p-2">
          <div className="relative w-full">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Search tracks"
              placeholder="Search tracks..."
              value={search}
              onChange={(event) => {
                containerRef.current?.scrollTo({ top: 0 });
                table.setGlobalFilter(event.target.value);
              }}
              className="h-9 pl-9"
            />
          </div>
        </div>
      )}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-auto">
        {audiofiles.length > 0 && (
          <Table className={cn(isMobile ? undefined : "table-fixed")}>
            {!isMobile && (
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "min-w-0",
                          header.column.columnDef.meta?.className,
                        )}
                      >
                        <table.FlexRender header={header} />
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            )}
            <TableBody>
              {rows.length > 0 ? (
                <VirtualizedRows
                  virtualRows={virtualRows}
                  totalSize={totalSize}
                  rows={rows}
                  table={table}
                  onPlay={handlePlay}
                  scrollMargin={scrollMargin}
                />
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No tracks match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        {pagination && <InfiniteScrollTrigger pagination={pagination} />}
      </div>
    </div>
  );
}

interface VirtualizedRowsProps {
  virtualRows: VirtualItem[];
  totalSize: number;
  rows: AudiofileTableRow[];
  table: AudiofileTableInstance;
  onPlay: (file: Audiofile, index: number) => void;
  scrollMargin: number;
}

const VirtualizedRows = memo(function VirtualizedRows({
  virtualRows,
  totalSize,
  rows,
  table,
  onPlay,
  scrollMargin,
}: VirtualizedRowsProps) {
  const paddingTop =
    virtualRows.length > 0 ? virtualRows[0].start - scrollMargin : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize -
        (virtualRows[virtualRows.length - 1].end - scrollMargin)
      : 0;

  return (
    <>
      {paddingTop > 0 && (
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            style={{ height: paddingTop }}
          />
        </tr>
      )}
      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return (
          <TableRow
            key={row.id}
            onClick={() => onPlay(row.original, row.index)}
            className="h-12 cursor-pointer group"
          >
            {row.getAllCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn("min-w-0", cell.column.columnDef.meta?.className)}
              >
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        );
      })}
      {paddingBottom > 0 && (
        <tr>
          <td
            colSpan={table.getAllColumns().length}
            style={{ height: paddingBottom }}
          />
        </tr>
      )}
    </>
  );
});

function getMobileColumns(
  onDelete: (file: Audiofile) => void,
  activeId: string | undefined,
  playbackState: string,
) {
  return columnHelper.columns([
    columnHelper.accessor(
      (file) =>
        [
          file.title,
          file.filename,
          file.artists?.join(", "),
          file.album,
        ]
          .filter(Boolean)
          .join(" "),
      {
        id: "row",
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const file = row.original;
          const isActive = activeId === file.id;
          const isPlaying = isActive && playbackState === "playing";

          return (
            <div className="flex items-center gap-3">
              <PlayButton
                index={row.index}
                isActive={isActive}
                isPlaying={isPlaying}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {file.title || file.filename}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {file.artists?.join(", ") || "Unknown Artist"}
                </div>
              </div>
              <RowActions file={file} onDelete={onDelete} />
            </div>
          );
        },
      },
    ),
  ]);
}

function getDesktopColumns(
  onDelete: (file: Audiofile) => void,
  activeId: string | undefined,
  playbackState: string,
) {
  return columnHelper.columns([
    columnHelper.display({
      id: "play",
      enableGlobalFilter: false,
      meta: { className: "w-12" },
      cell: ({ row }) => {
        const file = row.original;
        const isActive = activeId === file.id;
        const isPlaying = isActive && playbackState === "playing";
        return (
          <PlayButton
            index={row.index}
            isActive={isActive}
            isPlaying={isPlaying}
          />
        );
      },
    }),
    columnHelper.accessor(
      (row) => [row.title, row.filename].filter(Boolean).join(" "),
      {
        id: "title",
        header: "Title",
        enableGlobalFilter: true,
        meta: { className: "w-[30%] max-w-0" },
        cell: ({ row }) => (
          <span
            className={cn(
              "block truncate font-medium",
              activeId === row.original.id && "text-primary",
            )}
          >
            {row.original.title || row.original.filename}
          </span>
        ),
      },
    ),
    columnHelper.accessor((row) => row.artists?.join(", ") || "", {
      id: "artists",
      header: "Artist",
      enableGlobalFilter: true,
      meta: { className: "w-[25%] max-w-0" },
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue() || "Unknown"}
        </span>
      ),
    }),
    columnHelper.accessor("album", {
      header: "Album",
      enableGlobalFilter: true,
      meta: { className: "w-[25%] max-w-0 hidden md:table-cell" },
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue() || "-"}
        </span>
      ),
    }),
    columnHelper.accessor("duration", {
      header: () => <div className="text-right">Duration</div>,
      enableGlobalFilter: false,
      meta: { className: "w-20 text-right" },
      cell: ({ getValue }) => (
        <span className="font-mono text-muted-foreground">
          {formatDuration((getValue() ?? 0) / 1000)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      enableGlobalFilter: false,
      meta: { className: "w-10" },
      cell: ({ row }) => <RowActions file={row.original} onDelete={onDelete} />,
    }),
  ]);
}

interface PlayButtonProps {
  index: number;
  isActive: boolean;
  isPlaying: boolean;
}

const PlayButton = memo(function PlayButton({
  index,
  isActive,
  isPlaying,
}: PlayButtonProps) {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      {isActive ? (
        isPlaying ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <Play className="h-4 w-4 text-primary" />
        )
      ) : (
        <>
          <span className="text-sm text-muted-foreground transition-opacity group-hover:opacity-0">
            {index + 1}
          </span>
          <Play className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </>
      )}
    </div>
  );
});

interface RowActionsProps {
  file: Audiofile;
  onDelete: (file: Audiofile) => void;
}

function RowActions({ file, onDelete }: RowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 transition-opacity",
                "opacity-0 group-hover:opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{file.title || file.filename}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();

                setConfirmOpen(false);
                onDelete(file);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AudiofileTableSkeleton() {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="space-y-3 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                {isMobile && <Skeleton className="h-3 w-1/2" />}
              </div>
              {!isMobile && <Skeleton className="h-4 w-16 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { AudiofileTable, AudiofileTableSkeleton, type AudiofileTableProps };
