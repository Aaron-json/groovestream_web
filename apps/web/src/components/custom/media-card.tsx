import { Music3, Play, Pause, ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import type { Media } from "@groovestream/api/models";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { AudioSource } from "@groovestream/media/source";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { formatDuration } from "@groovestream/media/duration";
import { useShallow } from "zustand/react/shallow";
export type MediaCardProps = {
  media: Media;
  audiofileSource?: AudioSource;
  onClick?: () => void;
  index?: number;
};

const MediaCard = ({
  media,
  onClick,
  audiofileSource,
  index,
}: MediaCardProps) => {
  const {
    media: currentMedia,
    setMedia,
    playPauseToggle,
    playbackState,
  } = usePlaybackStore(
    useShallow((state) => ({
      media: state.playerState.currentMedia,
      setMedia: state.setMedia,
      playPauseToggle: state.playPauseToggle,
      playbackState: state.playerState.status,
    })),
  );

  const isAudio = "filename" in media;
  const isCurrentlyPlaying =
    isAudio &&
    currentMedia?.audiofile?.id === media.id &&
    playbackState === "playing";

  const playAudio = async () => {
    if (!audiofileSource) return;
    try {
      await setMedia(audiofileSource, index);
    } catch (error) {
      toast.error("Error loading media", {
        description:
          error instanceof Error ? error.message : "Unable to load media file",
      });
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (isAudio) {
      playAudio();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handlePlayPause = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isAudio) return;

    if (currentMedia?.audiofile?.id === media.id) {
      void playPauseToggle().catch((error) => {
        toast.error("Playback Error", {
          description: error instanceof Error ? error.message : undefined,
        });
      });
    } else {
      playAudio();
    }
  };

  const MediaIcon = isAudio ? Music3 : ListMusic;
  const PlayIcon = isCurrentlyPlaying ? Pause : Play;

  const innerContent = (
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
                {formatDuration(media.duration / 1000)}
              </span>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  );

  if (onClick || isAudio) {
    return (
      <Card
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className="w-36 cursor-pointer py-0 gap-0 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {innerContent}
      </Card>
    );
  }

  return (
    <Link
      to="/library/playlists/$playlistId"
      params={{ playlistId: media.id }}
      className="block w-36 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      preload="intent"
    >
      <Card className="py-0 gap-0 hover:bg-muted/50 transition-colors h-full w-full">
        {innerContent}
      </Card>
    </Link>
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
