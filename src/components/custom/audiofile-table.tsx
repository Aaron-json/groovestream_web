import {
  useState,
  useCallback,
  useDeferredValue,
  useRef,
  useMemo,
  memo,
} from "react";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  FilterFn,
} from "@tanstack/react-table";
import { Trash2, Search, Play, Pause, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { Audiofile } from "@/api/types/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/media/utils";
import { MediaQueryKey, useDeleteAudioFile } from "@/hooks/media";
import { useMediaStateStore } from "@/lib/media/stores/state";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

const columnHelper = createColumnHelper<Audiofile>();

const searchFilter: FilterFn<Audiofile> = (row, _, value) => {
  const search = String(value).toLowerCase();
  const file = row.original;
  return (
    file.title?.toLowerCase().includes(search) ||
    file.filename?.toLowerCase().includes(search) ||
    file.album?.toLowerCase().includes(search) ||
    file.artists?.some((a) => a.toLowerCase().includes(search)) ||
    false
  );
};

const ROW_HEIGHT_MOBILE = 56;
const ROW_HEIGHT_DESKTOP = 48;

type AudiofileTableProps = {
  audiofiles: Audiofile[];
  queryKey: MediaQueryKey;
  skeleton?: boolean;
  onChange?: () => void;
  refetch?: () => void;
  className?: string;
  showSearch?: boolean;
  showCount?: boolean;
};

function AudiofileTable({
  audiofiles,
  queryKey,
  skeleton,
  onChange,
  refetch,
  className,
  showSearch = true,
  showCount = true,
}: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const deleteAudioFile = useDeleteAudioFile();
  const containerRef = useRef<HTMLDivElement>(null);

  const { media, setMedia, playPauseToggle, playbackState } =
    useMediaStateStore(
      useShallow((state) => ({
        media: state.media,
        setMedia: state.setMedia,
        playPauseToggle: state.playPauseToggle,
        playbackState: state.playbackState,
      })),
    );

  const handlePlay = useCallback(
    (file: Audiofile) => {
      if (media?.audiofile?.id === file.id) {
        playPauseToggle();
      } else {
        const index = audiofiles.findIndex((f) => f.id === file.id);
        setMedia(queryKey, index).catch((error) => {
          toast.error("Playback Error", { description: error.message });
        });
      }
    },
    [audiofiles, media?.audiofile?.id, playPauseToggle, setMedia, queryKey],
  );

  const handleDelete = useCallback(
    (file: Audiofile) => {
      deleteAudioFile(file)
        .then(() => {
          onChange?.();
          refetch?.();
          toast.success("Track deleted");
        })
        .catch((error) => {
          toast.error("Delete Error", { description: error.message });
        });
    },
    [deleteAudioFile, onChange, refetch],
  );

  const columns = useMemo(
    () =>
      isMobile
        ? getMobileColumns(handleDelete, media?.audiofile?.id, playbackState)
        : getDesktopColumns(handleDelete, media?.audiofile?.id, playbackState),
    [isMobile, handleDelete, media?.audiofile?.id, playbackState],
  );

  const table = useReactTable({
    data: audiofiles,
    columns,
    state: { globalFilter: deferredFilter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  if (skeleton) {
    return <TableSkeleton isMobile={isMobile} />;
  }

  const hasNoData = !audiofiles || audiofiles.length === 0;
  const hasFilterNoResults = rows.length === 0 && filter && !hasNoData;
  const showEmpty = hasNoData || hasFilterNoResults;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-md border",
        className,
      )}
    >
      {showSearch && (
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tracks..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          {showCount && (
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              {rows.length} tracks
            </span>
          )}
        </div>
      )}

      <div ref={containerRef} className="flex min-h-0 flex-1 overflow-auto">
        {showEmpty ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {filter ? "No tracks match your search." : "No tracks found."}
          </div>
        ) : (
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
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            )}
            <TableBody>
              <VirtualizedRows
                virtualRows={virtualRows}
                totalSize={totalSize}
                rows={rows}
                table={table}
                onPlay={handlePlay}
              />
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

interface VirtualizedRowsProps {
  virtualRows: VirtualItem[];
  totalSize: number;
  rows: ReturnType<
    ReturnType<typeof useReactTable<Audiofile>>["getRowModel"]
  >["rows"];
  table: ReturnType<typeof useReactTable<Audiofile>>;
  onPlay: (file: Audiofile) => void;
}

const VirtualizedRows = memo(function VirtualizedRows({
  virtualRows,
  totalSize,
  rows,
  table,
  onPlay,
}: VirtualizedRowsProps) {
  const paddingTop = virtualRows[0]?.start ?? 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
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
            onClick={() => onPlay(row.original)}
            className="cursor-pointer group"
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell
                key={cell.id}
                className={cn("min-w-0", cell.column.columnDef.meta?.className)}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  return [
    columnHelper.display({
      id: "row",
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
    }),
  ];
}

function getDesktopColumns(
  onDelete: (file: Audiofile) => void,
  activeId: string | undefined,
  playbackState: string,
) {
  return [
    columnHelper.display({
      id: "play",
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
    columnHelper.accessor((row) => row.title || row.filename, {
      id: "title",
      header: "Title",
      meta: { className: "w-[30%] max-w-0" },
      cell: ({ getValue, row }) => (
        <span
          className={cn(
            "block truncate font-medium",
            activeId === row.original.id && "text-primary",
          )}
        >
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("artists", {
      header: "Artist",
      meta: { className: "w-[25%] max-w-0" },
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue()?.join(", ") || "Unknown"}
        </span>
      ),
    }),
    columnHelper.accessor("album", {
      header: "Album",
      meta: { className: "w-[25%] max-w-0 hidden md:table-cell" },
      cell: ({ getValue }) => (
        <span className="block truncate text-muted-foreground">
          {getValue() || "-"}
        </span>
      ),
    }),
    columnHelper.accessor("duration", {
      header: () => <div className="text-right">Duration</div>,
      meta: { className: "w-20 text-right" },
      cell: ({ getValue }) => (
        <span className="font-mono text-muted-foreground">
          {formatDuration(getValue())}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      meta: { className: "w-10" },
      cell: ({ row }) => <RowActions file={row.original} onDelete={onDelete} />,
    }),
  ];
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

function TableSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border">
      <div className="shrink-0 border-b p-3">
        <Skeleton className="h-8 w-full" />
      </div>
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
  );
}

export { AudiofileTable, type AudiofileTableProps };
