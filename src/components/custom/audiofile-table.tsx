import { useContext, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Audiofile } from "../../types/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/media";
import { useToast } from "@/hooks/use-toast";
import { mediaContext } from "@/contexts/media";
import { Trash2, Search } from "lucide-react";
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
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";

type AudiofileTableProps = {
  audiofiles: Audiofile[];
  mediaStoreKey?: string;
  skeleton?: boolean;
  refetch?: () => void;
};

export default function AudiofileTable(props: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const mediaCtx = useContext(mediaContext);
  const [globalFilter, setGlobalFilter] = useState("");
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);

  if (!mediaCtx) {
    throw new Error("Media context not found");
  }

  const onClick = async (audiofile: Audiofile, index: number) => {
    if (props.mediaStoreKey) {
      try {
        await mediaCtx.setMedia(audiofile, props.mediaStoreKey, index);
      } catch (error: any) {
        const message = error.message ? error.message : "Error loading media";
        toast({
          variant: "destructive",
          title: "Error loading media",
          description: message.toString(),
        });
      }
    }
  };

  const onDeleteAudiofile = async (audiofileId: number) => {
    try {
      await deleteAudioFile(audiofileId);
      props.refetch?.();
      toast({
        title: "Audio file deleted",
        description: "The audio file has been successfully removed.",
      });
    } catch (error: any) {
      const message = error.message
        ? error.message
        : "Error deleting audio file";
      toast({
        variant: "destructive",
        title: "Error deleting audio file",
        description: message,
      });
    }
  };

  const columnHelper = createColumnHelper<Audiofile>();

  const columns = [
    columnHelper.accessor((_, index) => index + 1, {
      id: "index",
      header: "#",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => row.title || row.filename, {
      id: "title",
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor(
      (row) => row.artists?.join(", ") || "Unknown artist",
      {
        id: "artist",
        header: "Artist",
        cell: (info) => info.getValue(),
      },
    ),
    ...(!isMobile
      ? [
          columnHelper.accessor((row) => row.album || "Unknown album", {
            id: "album",
            header: "Album",
            cell: (info) => info.getValue(),
          }),
        ]
      : []),
    columnHelper.accessor((row) => formatDuration(row.duration), {
      id: "duration",
      header: () => <div className="text-right">Duration</div>,
      cell: (info) => <div className="text-right">{info.getValue()}</div>,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="w-[50px]">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${hoveredRowId === row.original.id ? "opacity-100" : "opacity-0"}`}
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteAudiofile(row.original.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: props.audiofiles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search audio files..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
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
                colSpan={isMobile ? 5 : 6}
                className="h-24 text-center"
              >
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.original.id}
                onMouseEnter={() => setHoveredRowId(row.original.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("button")) {
                    onClick(row.original, row.index);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
