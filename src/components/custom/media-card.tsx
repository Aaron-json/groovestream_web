import { Music3, Play, Pause, ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Media } from "@/api/types/media";
import { isAudiofile } from "@/api/types/media";
import { Skeleton } from "../ui/skeleton";
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
  const currentMedia = useMediaStore((state) => state.media);
  const setMedia = useMediaStore((state) => state.setMedia);
  const playPauseToggle = useMediaStore((state) => state.playPauseToggle);
  const playbackState = useMediaStore((state) => state.playbackState);

  const navigate = useNavigate();
  const _isAudiofile = isAudiofile(media);
  const currentAudiofile = currentMedia?.audiofile;

  const handleClick = async (_: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick();
      return;
    }
    if (_isAudiofile) {
      if (storeKey && queryKey) {
        try {
          await setMedia(storeKey, queryKey, index);
        } catch (error: any) {
          const message = error.message ? error.message : "Error loading media";
          toast("Error loading media", {
            description: message.toString(),
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
    if (!_isAudiofile) {
      return;
    }
    if (currentAudiofile?.id === media.id) {
      playPauseToggle();
    } else if (storeKey && queryKey) {
      setMedia(storeKey, queryKey, index);
    }
  };

  const renderIcon = () => {
    return _isAudiofile ? (
      <Music3 className="w-10 h-10 text-muted-foreground" />
    ) : (
      <ListMusic className="w-10 h-10 text-muted-foreground" />
    );
  };

  const renderPlaybackButton = () => {
    if (!_isAudiofile) {
      return null;
    }
    let icon: React.ReactNode;
    if (
      playbackState !== "playing" ||
      (playbackState === "playing" && currentAudiofile?.id !== media.id)
    ) {
      icon = <Play className="h-5 w-5" />;
    } else {
      icon = <Pause className="h-5 w-5" />;
    }

    return (
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7"
        onClick={handlePlayPause}
      >
        {icon}
      </Button>
    );
  };

  const renderMetadata = () => {
    if (_isAudiofile) {
      return (
        <>
          <span className="truncate font-semibold text-sm text-primary">
            {media.title || media.filename}
          </span>
          <div className="flex gap-1 justify-between items-center text-xs text-muted-foreground">
            <span className="truncate">
              {media.artists?.join(", ") || "Unknown Artist"}
            </span>
            <span className="shrink-0">{formatDuration(media.duration)}</span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <span className="truncate font-semibold text-sm text-primary">
            {media.name}
          </span>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="truncate">Created by {media.owner_username}</span>
          </div>
        </>
      );
    }
  };

  return (
    <Card
      onClick={handleClick}
      className="w-[9.5rem] hover:bg-muted/15 transition-scale duration-200 rounded-md"
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-1">
          <AspectRatio ratio={1} className="bg-muted relative group rounded-md">
            <div className="absolute inset-0 flex items-center justify-center">
              {renderIcon()}
            </div>
            {renderPlaybackButton()}
          </AspectRatio>
          <div className="flex flex-col px-2 pb-1.5">{renderMetadata()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export function MediaCardSkeleton() {
  return (
    <div className="w-[9.5rem] rounded-md">
      <Skeleton className="w-full aspect-square" />
      <div className="flex flex-col gap-2 py-2">
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
