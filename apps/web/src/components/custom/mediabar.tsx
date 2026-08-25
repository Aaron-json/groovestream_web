import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  LoaderCircle,
  ChevronRight,
  Music2,
} from "lucide-react";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { useUIStore } from "@/lib/ui";
import { formatDuration } from "@groovestream/media/duration";
import { useIsMobile } from "@/hooks/use-mobile";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

export default function MediaBar() {
  const isMobile = useIsMobile();

  const { media, playbackState, next, prev, playPauseToggle } =
    usePlaybackStore(
      useShallow((state) => ({
        media: state.playerState.currentMedia,
        playbackState: state.playerState.status,
        next: state.next,
        prev: state.previous,
        playPauseToggle: state.playPauseToggle,
      })),
    );

  const toggleNowPlaying = useUIStore((state) => state.toggleNowPlaying);

  const runControl = (control: () => Promise<void>) => {
    void control().catch((error) => {
      toast.error("Playback Error", {
        description: error instanceof Error ? error.message : undefined,
      });
    });
  };

  const audiofile = media?.audiofile;

  const getPlayIcon = () => {
    switch (playbackState) {
      case "playing":
        return <Pause className="h-5 w-5" />;
      case "loading":
        return <LoaderCircle className="h-5 w-5 animate-spin" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  const trackTitle = audiofile?.title || audiofile?.filename || "No media";
  const trackArtist = audiofile?.artists?.length
    ? audiofile.artists.join(", ")
    : "Unknown artist";

  return (
    <div className="bg-card border border-border/80 rounded-xl shadow-md">
      {isMobile ? (
        <MobileLayout
          trackTitle={trackTitle}
          trackArtist={trackArtist}
          playIcon={getPlayIcon()}
          onPlayPause={() => runControl(playPauseToggle)}
          onExpand={audiofile ? toggleNowPlaying : undefined}
        />
      ) : (
        <DesktopLayout
          trackTitle={trackTitle}
          trackArtist={trackArtist}
          playIcon={getPlayIcon()}
          onPlayPause={() => runControl(playPauseToggle)}
          onNext={() => runControl(next)}
          onPrev={() => runControl(prev)}
          onExpand={audiofile ? toggleNowPlaying : undefined}
        />
      )}
    </div>
  );
}

interface MobileLayoutProps {
  trackTitle: string;
  trackArtist: string;
  playIcon: ReactNode;
  onPlayPause: () => void;
  onExpand?: () => void;
}

function MobileLayout({
  trackTitle,
  trackArtist,
  playIcon,
  onPlayPause,
  onExpand,
}: MobileLayoutProps) {
  return (
    <div className="px-3 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <TrackInfo
            title={trackTitle}
            artist={trackArtist}
            onClick={onExpand}
          />
          <ControlButton
            icon={playIcon}
            onClick={onPlayPause}
            className="h-10 w-10"
          />
        </div>
        <Seeker />
      </div>
    </div>
  );
}

interface DesktopLayoutProps {
  trackTitle: string;
  trackArtist: string;
  playIcon: ReactNode;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand?: () => void;
}

function DesktopLayout({
  trackTitle,
  trackArtist,
  playIcon,
  onPlayPause,
  onNext,
  onPrev,
  onExpand,
}: DesktopLayoutProps) {
  return (
    <div className="px-3 py-2">
      <div className="grid grid-cols-12 gap-7 items-center">
        <div className="col-span-3 min-w-0">
          <TrackInfo
            title={trackTitle}
            artist={trackArtist}
            onClick={onExpand}
          />
        </div>

        <div className="col-span-6 flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2">
            <ControlButton
              icon={<SkipBack className="h-5 w-5" />}
              onClick={onPrev}
              aria-label="Previous track"
            />
            <ControlButton
              icon={playIcon}
              onClick={onPlayPause}
              className="h-10 w-10"
              aria-label="Play/Pause"
            />
            <ControlButton
              icon={<SkipForward className="h-5 w-5" />}
              onClick={onNext}
              aria-label="Next track"
            />
          </div>
          <div className="w-full max-w-lg">
            <Seeker />
          </div>
        </div>

        <div className="col-span-3 flex items-center justify-end">
          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

interface TrackInfoProps {
  title: string;
  artist: string;
  onClick?: () => void;
}

function TrackInfo({ title, artist, onClick }: TrackInfoProps) {
  const nowPlayingOpen = useUIStore((state) => state.nowPlayingOpen);
  const inner = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted">
        <Music2 className="size-5.5 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <h3
          className="text-sm font-medium text-foreground truncate"
          title={title}
        >
          {title}
        </h3>
        <p className="text-xs text-muted-foreground truncate" title={artist}>
          {artist}
        </p>
      </div>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex w-full min-w-0 items-center gap-3 p-1">{inner}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle now playing panel"
      aria-expanded={nowPlayingOpen}
      className="flex w-full min-w-0 items-center gap-3 rounded-lg p-1 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    >
      {inner}
      <ChevronRight className="mr-1 size-4 shrink-0 text-muted-foreground/70" />
    </button>
  );
}

function Seeker() {
  const { position, duration, seek } = usePlaybackStore(
    useShallow((state) => ({
      position: state.playerState.position,
      duration: state.playerState.duration,
      seek: state.seek,
    })),
  );

  const [seekPreview, setSeekPreview] = useState<number>();
  const displayedPosition = seekPreview ?? Math.floor(position);

  function handleSeekCommit(value: number | readonly number[]) {
    const nextPosition = getSliderValue(value);
    setSeekPreview(undefined);
    void seek(nextPosition).catch((error) => {
      toast.error("Playback Error", {
        description: error instanceof Error ? error.message : undefined,
      });
    });
  }

  return (
    <div className="flex items-center gap-2 w-full text-xs">
      <span className="text-muted-foreground min-w-10 font-mono">
        {formatDuration(displayedPosition)}
      </span>

      <Slider
        className="flex-1"
        max={duration}
        disabled={duration === 0}
        min={0}
        step={1}
        value={displayedPosition}
        onValueChange={(value) => setSeekPreview(getSliderValue(value))}
        onValueCommitted={handleSeekCommit}
        aria-label="Seek position"
      />

      <span className="text-muted-foreground min-w-10 text-right font-mono">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

interface ControlButtonProps {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
  "aria-label"?: string;
}

function ControlButton({
  icon,
  onClick,
  className = "h-8 w-8",
  "aria-label": ariaLabel,
}: ControlButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`text-muted-foreground hover:text-foreground transition-colors ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {icon}
    </Button>
  );
}

function VolumeControl() {
  const { volume, setVolume, mute, setMute } = usePlaybackStore(
    useShallow((state) => ({
      volume: state.playerState.volume,
      setVolume: state.setVolume,
      mute: state.playerState.muted,
      setMute: state.setMute,
    })),
  );

  function toggleMute() {
    setMute(!mute);
  }

  const VolumeIcon = mute ? VolumeX : Volume2;

  return (
    <div className="flex flex-1 max-w-40 items-center gap-2">
      <ControlButton
        icon={<VolumeIcon className="h-5 w-5" />}
        onClick={toggleMute}
        aria-label={mute ? "Unmute" : "Mute"}
      />
      <Slider
        value={volume}
        onValueChange={(value) => setVolume(getSliderValue(value))}
        max={1}
        min={0}
        step={0.01}
        className="w-24"
        aria-label="Volume"
      />
    </div>
  );
}

function getSliderValue(value: number | readonly number[]) {
  return typeof value === "number" ? value : value[0];
}
