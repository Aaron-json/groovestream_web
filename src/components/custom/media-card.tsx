import { useContext } from "react";
import { Music3, Play, Pause, ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Media } from "@/types/media";
import { isAudiofile } from "@/types/media";
import { Skeleton } from "../ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { mediaContext } from "@/contexts/media";
import { formatDuration } from "@/lib/media";
import { useToast } from "@/hooks/use-toast";

export type MediaCardProps = {
  media: Media;
  onClick?: () => void;
  mediaStoreKey?: string;
  index?: number;
};

const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onClick,
  mediaStoreKey,
  index,
}) => {
  const mediaCtx = useContext(mediaContext);
  if (!mediaCtx) {
    throw new Error("Media context not found");
  }
  const navigate = useNavigate();
  const _isAudiofile = isAudiofile(media);
  const { toast } = useToast();

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }
    if (_isAudiofile) {
      if (mediaStoreKey) {
        try {
          await mediaCtx.setMedia(media, mediaStoreKey, index);
        } catch (error: any) {
          const message = error.message ? error.message : "Error loading media";
          toast({
            variant: "destructive",
            title: "Error loading media",
            description: message.toString(),
          });
        }
      }
    } else {
      navigate({
        to: `/library/playlists/$playlistId`,
        params: { playlistId: media.id.toString() },
      });
    }
  };

  const handlePlayPause = () => {
    mediaCtx.playPauseToggle();
  };

  const renderIcon = () => {
    return _isAudiofile ? (
      <Music3 className="w-10 h-10 text-muted-foreground" />
    ) : (
      <ListMusic className="w-10 h-10 text-muted-foreground" />
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
      className="w-40 hover:bg-muted/15 transition-scale duration-200 rounded-md"
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-1">
          <AspectRatio ratio={1} className="bg-muted relative group rounded-md">
            <div className="absolute inset-0 flex items-center justify-center">
              {renderIcon()}
            </div>
            {_isAudiofile && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-7 w-7"
                onClick={handlePlayPause}
              >
                {mediaCtx.playbackState === "playing" ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
          </AspectRatio>
          <div className="flex flex-col px-2 pb-1.5">{renderMetadata()}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export function MediaCardSkeleton() {
  return (
    <div className="w-40 rounded-md">
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
