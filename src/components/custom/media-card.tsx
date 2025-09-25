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
import { useMediaStore, formatDuration } from "@/lib/media";

export type MediaCardProps = {
  media: Media;
  storeKey?: string;
  queryKey?: MediaQueryKey;
  onClick?: () => void;
  index?: number;
};

const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onClick,
  storeKey,
  queryKey,
  index,
}) => {
  const {
    media: currentMedia,
    setMedia,
    playPauseToggle,
    playbackState,
  } = useMediaStore();
  const navigate = useNavigate();

  const isAudio = isAudiofile(media);
  const isCurrentlyPlaying =
    isAudio &&
    currentMedia?.audiofile?.id === media.id &&
    playbackState === "playing";

  const handleCardClick = async (_: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick();
      return;
    }

    if (isAudio) {
      if (storeKey && queryKey) {
        try {
          await setMedia(storeKey, queryKey, index);
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

  const handlePlayPause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!isAudio) return;

    if (currentMedia?.audiofile?.id === media.id) {
      playPauseToggle();
    } else if (storeKey && queryKey) {
      setMedia(storeKey, queryKey, index);
    }
  };

  const MediaIcon = isAudio ? Music3 : ListMusic;
  const PlayIcon = isCurrentlyPlaying ? Pause : Play;

  return (
    <Card
      onClick={handleCardClick}
      className="w-[9.5rem] cursor-pointer hover:bg-accent/50 transition-colors duration-200 border-border"
    >
      <CardContent className="p-0">
        <div className="flex flex-col">
          <AspectRatio
            ratio={1}
            className="bg-muted relative group overflow-hidden rounded-t-md"
          >
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <MediaIcon className="h-10 w-10 text-muted-foreground" />
            </div>

            {isAudio && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                onClick={handlePlayPause}
                aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            )}
          </AspectRatio>

          <div className="flex flex-col gap-1 p-2">
            <h3 className="font-medium text-sm text-foreground truncate leading-tight">
              {isAudio ? media.title || media.filename : media.name}
            </h3>

            <div className="flex items-center justify-between text-xs text-muted-foreground min-h-[1.125rem]">
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
    <div className="w-[9.5rem]">
      <div className="space-y-3">
        <Skeleton className="aspect-square w-full rounded-md" />
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
