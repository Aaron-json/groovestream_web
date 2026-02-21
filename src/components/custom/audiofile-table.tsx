import {
  useState,
  useCallback,
  useDeferredValue,
  useRef,
  useMemo,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
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

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    className?: string;
  }
}

const globalFilterFn: FilterFn<Audiofile> = (row, _, filterValue) => {
  const search = String(filterValue).toLowerCase();
  const file = row.original;
  return (
    file.title?.toLowerCase().includes(search) ||
    file.filename?.toLowerCase().includes(search) ||
    file.album?.toLowerCase().includes(search) ||
    file.artists?.some((a) => a.toLowerCase().includes(search)) ||
    false
  );
};

export default function AudiofileTable({
  audiofiles,
  storeKey,
  queryKey,
  skeleton,
  onChange,
  refetch,
  className,
  showSearch = true,
  showCount = true,
}: {
  audiofiles: Audiofile[];
  storeKey: string;
  queryKey: MediaQueryKey;
  skeleton?: boolean;
  onChange?: () => void;
  refetch?: () => void;
  className?: string;
  showSearch?: boolean;
  showCount?: boolean;
}) {
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
    async (index: number, file: Audiofile) => {
      try {
        if (media?.audiofile?.id === file.id) playPauseToggle();
        else await setMedia(storeKey, queryKey, index);
      } catch (err: any) {
        toast.error("Playback Error", { description: err?.message });
      }
    },
    [media, playPauseToggle, setMedia, storeKey, queryKey],
  );

  const handleDelete = useCallback(
    async (file: Audiofile) => {
      try {
        await deleteAudioFile(file);
        onChange?.();
        refetch?.();
        toast.success("Track deleted");
      } catch (err: any) {
        toast.error("Delete Error", { description: err?.message });
      }
    },
    [deleteAudioFile, onChange, refetch],
  );

  const columns = useMemo<ColumnDef<Audiofile>[]>(() => {
    const playCell = ({ row }: any) => {
      const file = row.original;
      const isActive = media?.audiofile?.id === file.id;
      const isPlaying = isActive && playbackState === "playing";

      return (
        <div className="group relative flex h-8 w-8 items-center justify-center text-muted-foreground">
          {isActive ? (
            isPlaying ? (
              <Pause className="h-4 w-4 text-primary" />
            ) : (
              <Play className="h-4 w-4 text-primary" />
            )
          ) : (
            <>
              <span className="text-sm group-hover:opacity-0">
                {row.index + 1}
              </span>
              <Play className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-foreground" />
            </>
          )}
        </div>
      );
    };

    if (isMobile) {
      return [
        {
          id: "mobile",
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              {playCell({ row })}
              <div className="flex-1 grid gap-0.5 min-w-0">
                <span className="truncate text-sm font-medium">
                  {row.original.title || row.original.filename}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {row.original.artists?.join(", ") || "Unknown Artist"}
                </span>
              </div>
              <RowActions
                file={row.original}
                onDelete={() => handleDelete(row.original)}
              />
            </div>
          ),
        },
      ];
    }

    return [
      { id: "play", meta: { className: "w-12 text-center" }, cell: playCell },
      {
        accessorFn: (row) => row.title || row.filename,
        header: "Title",
        cell: ({ getValue, row }) => (
          <span
            className={`truncate font-medium ${media?.audiofile?.id === row.original.id ? "text-primary" : ""}`}
          >
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "artists",
        header: "Artist",
        cell: ({ getValue }) => (
          <span className="truncate text-muted-foreground">
            {getValue<string[]>()?.join(", ") || "Unknown"}
          </span>
        ),
      },
      {
        accessorKey: "album",
        header: "Album",
        cell: ({ getValue }) => (
          <span className="truncate text-muted-foreground">
            {getValue<string>() || "-"}
          </span>
        ),
      },
      {
        accessorKey: "duration",
        header: () => <div className="text-right">Duration</div>,
        meta: { className: "w-24 text-right" },
        cell: ({ getValue }) => (
          <span className="font-mono text-muted-foreground">
            {formatDuration(getValue<number>())}
          </span>
        ),
      },
      {
        id: "actions",
        meta: { className: "w-12 text-right pr-4" },
        cell: ({ row }) => (
          <RowActions
            file={row.original}
            onDelete={() => handleDelete(row.original)}
          />
        ),
      },
    ];
  }, [isMobile, handlePlay, handleDelete, media?.audiofile?.id, playbackState]);

  const table = useReactTable({
    data: audiofiles,
    columns,
    state: { globalFilter: deferredFilter },
    onGlobalFilterChange: setFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => (isMobile ? 60 : 52),
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows[0]?.start || 0;
  const paddingBottom = virtualRows.length
    ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0;

  if (skeleton) return <TableSkeleton isMobile={isMobile} />;

  return (
    <div className={`rounded-md border ${className || ""}`}>
      {showSearch && (
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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

      <div ref={containerRef} className="max-h-[600px] overflow-auto">
        {rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No tracks found.
          </div>
        ) : (
          <Table>
            {!isMobile && (
              <TableHeader className="sticky top-0 bg-background z-10">
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className={h.column.columnDef.meta?.className}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
            )}
            <TableBody>
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} />
                </tr>
              )}

              {virtualRows.map((vRow) => {
                const row = rows[vRow.index];
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => handlePlay(vRow.index, row.original)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cell.column.columnDef.meta?.className}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: paddingBottom }} />
                </tr>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// Extracted Action Menu to reduce column bloat
function RowActions({
  file,
  onDelete,
}: {
  file: Audiofile;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
              setOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              onDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TableSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="rounded-md border">
      <div className="border-b p-3">
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="grid gap-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              {isMobile && <Skeleton className="h-3 w-1/4" />}
            </div>
            {!isMobile && <Skeleton className="h-4 w-24" />}
          </div>
        ))}
      </div>
    </div>
  );
}
