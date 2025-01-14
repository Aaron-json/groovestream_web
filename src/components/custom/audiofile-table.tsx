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
type AudiofileTableProps = {
  audiofiles: Audiofile[];
  mediaStoreKey?: string;
  skeleton?: boolean;
};

const nonMobileRows: (keyof Audiofile)[] = [
  "title",
  "artists",
  "album",
  "duration",
];
const mobileRows: (keyof Audiofile)[] = ["title", "artists", "album"];

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
  function getRows() {
    const columns = isMobile ? mobileRows : nonMobileRows;
    if (props.audiofiles.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length}>
            <span className="text-muted-foreground">No audio files yet</span>
          </TableCell>
        </TableRow>
      );
    }
    return props.audiofiles.map((audiofile, index) => {
      return (
        <TableRow key={audiofile.id} onClick={() => onClick(audiofile, index)}>
          <TableCell>{audiofile.title}</TableCell>
          <TableCell>
            {audiofile.artists
              ? audiofile.artists.join(", ")
              : "Unknown artist"}
          </TableCell>
          {!isMobile && (
            <TableCell>
              {audiofile.album ? audiofile.album : "Unknown album"}
            </TableCell>
          )}
          <TableCell className="text-right">
            {formatDuration(audiofile.duration)}
          </TableCell>
        </TableRow>
      );
    });
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
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
