import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Audiofile } from "../../types/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDuration } from "@/lib/media";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { mediaContext } from "@/contexts/media";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { ContextMenuContent } from "@radix-ui/react-context-menu";
import { Trash2 } from "lucide-react";
import { deleteAudioFile } from "@/api/requests/media";
type AudiofileTableProps = {
  audiofiles: Audiofile[];
  mediaStoreKey?: string;
  skeleton?: boolean;
};

export default function AudiofileTable(props: AudiofileTableProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const mediaCtx = useContext(mediaContext);
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
  function getRows() {
    const columnsLength = isMobile ? 4 : 5;
    if (props.audiofiles.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columnsLength}>
            <span className="text-muted-foreground">No audio files yet</span>
          </TableCell>
        </TableRow>
      );
    }
    return props.audiofiles.map((audiofile, index) => {
      let artistsText: string;
      if (!audiofile.artists || audiofile.artists.length === 0) {
        artistsText = "Unknown artist";
      } else {
        artistsText = audiofile.artists.join(", ");
      }
      return (
        <ContextMenu key={audiofile.id}>
          <ContextMenuTrigger asChild>
            <TableRow
              key={audiofile.id}
              onClick={() => onClick(audiofile, index)}
            >
              <TableCell>{index + 1}</TableCell>
              <TableCell>{audiofile.title || audiofile.filename}</TableCell>
              <TableCell>{artistsText}</TableCell>
              {!isMobile && (
                <TableCell>
                  {audiofile.album ? audiofile.album : "Unknown album"}
                </TableCell>
              )}
              <TableCell className="text-right">
                {formatDuration(audiofile.duration)}
              </TableCell>
            </TableRow>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52 rounded-md bg-popover border">
            <ContextMenuItem onClick={() => onDeleteAudiofile(audiofile.id)}>
              <Trash2 className="h-5 w-5 mr-2" />
              <span>Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    });
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Artist</TableHead>
          {!isMobile && <TableHead>Album</TableHead>}
          <TableHead className="text-right">Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>{getRows()}</TableBody>
    </Table>
  );
}
