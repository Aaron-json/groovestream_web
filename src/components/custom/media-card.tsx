import { Music3, Play, Pause, ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Media } from "@/api/types/media";
import { isAudiofile } from "@/api/types/media";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { MediaQueryKey } from "@/hooks/media";
import { useMediaStateStore } from "@/lib/media/stores/state";
import { formatDuration } from "@/lib/media/utils";
export type MediaCardProps = {
  media: Media;
  queryKey?: MediaQueryKey;
  onClick?: () => void;
  index?: number;
};

const MediaCard = ({ media, onClick, queryKey, index }: MediaCardProps) => {
  const {
    media: currentMedia,
    setMedia,
    playPauseToggle,
    playbackState,
  } = useMediaStateStore();
  const navigate = useNavigate();

  const isAudio = isAudiofile(media);
  const isCurrentlyPlaying =
    isAudio &&
    currentMedia?.audiofile?.id === media.id &&
    playbackState === "playing";

  const handleCardClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    if (isAudio) {
      if (queryKey) {
        try {
          await setMedia(queryKey, index);
        } catch (error: any) {
          toast.error("Error loading media", {
            description: error?.message || "Unable to load media file",
          });
        }
      }
    } else {
      navigate({
        to: `/library/playlists/$playlistId`,
        params: { playlistId: media.id },
      });
    }
  };

  const handlePlayPause = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // This stops error from propagating to the card if only the
    // play/pause button is clicked
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (!isAudio) return;

    if (currentMedia?.audiofile?.id === media.id) {
      playPauseToggle();
    } else if (queryKey) {
      try {
        await setMedia(queryKey, index);
      } catch (error: any) {
        toast.error("Error loading media", {
          description: error?.message || "Unable to load media file",
        });
      }
    }
  };

  const MediaIcon = isAudio ? Music3 : ListMusic;
  const PlayIcon = isCurrentlyPlaying ? Pause : Play;

  return (
    <Card onClick={handleCardClick} className="w-36 cursor-pointer py-0 gap-0">
      <CardContent className="p-0 group">
        <div className="flex flex-col">
          <AspectRatio ratio={1} className="relative overflow-hidden rounded">
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <MediaIcon className="h-10 w-10 text-muted-foreground" />
            </div>

            {isAudio && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute bottom-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                onClick={handlePlayPause}
                aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            )}
          </AspectRatio>

          <div className="flex flex-col p-1.5">
            <h3 className="font-medium text-sm text-foreground truncate leading-tight">
              {isAudio ? media.title || media.filename : media.name}
            </h3>

            <div className="flex items-center justify-between text-xs text-muted-foreground min-h-4.5">
              <span className="truncate">
                {isAudio
                  ? media.artists?.join(", ") || "Unknown Artist"
                  : `Created by ${media.owner_username}`}
              </span>

              {isAudio && media.duration && (
                <span className="shrink-0 ml-2 font-mono">
                  {formatDuration(media.duration)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function MediaCardSkeleton() {
  return (
    <div className="w-36">
      <div className="space-y-3">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-2 px-1">
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
