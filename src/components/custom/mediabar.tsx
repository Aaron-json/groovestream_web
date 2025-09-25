import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  LoaderCircle,
} from "lucide-react";
import { useMediaStore, formatDuration } from "@/lib/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { useShallow } from "zustand/react/shallow";

export default function MediaBar() {
  const isMobile = useIsMobile();

  const { media, playbackState, next, prev, playPauseToggle } = useMediaStore(
    useShallow((state) => ({
      media: state.media,
      playbackState: state.playbackState,
      next: state.next,
      prev: state.prev,
      playPauseToggle: state.playPauseToggle,
    })),
  );

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
    <div className="bg-card border border-border shadow-sm rounded-lg">
      {isMobile ? (
        <MobileLayout
          trackTitle={trackTitle}
          trackArtist={trackArtist}
          playIcon={getPlayIcon()}
          onPlayPause={playPauseToggle}
        />
      ) : (
        <DesktopLayout
          trackTitle={trackTitle}
          trackArtist={trackArtist}
          playIcon={getPlayIcon()}
          onPlayPause={playPauseToggle}
          onNext={next}
          onPrev={prev}
        />
      )}
    </div>
  );
}

interface MobileLayoutProps {
  trackTitle: string;
  trackArtist: string;
  playIcon: React.ReactNode;
  onPlayPause: () => void;
}

function MobileLayout({
  trackTitle,
  trackArtist,
  playIcon,
  onPlayPause,
}: MobileLayoutProps) {
  return (
    <div className="px-3 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <TrackInfo title={trackTitle} artist={trackArtist} />
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
  playIcon: React.ReactNode;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function DesktopLayout({
  trackTitle,
  trackArtist,
  playIcon,
  onPlayPause,
  onNext,
  onPrev,
}: DesktopLayoutProps) {
  return (
    <div className="px-2 py-2">
      <div className="grid grid-cols-12 gap-7 items-center">
        <div className="col-span-3 min-w-0">
          <TrackInfo title={trackTitle} artist={trackArtist} />
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
          <div className="w-full max-w-[32rem]">
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
}

function TrackInfo({ title, artist }: TrackInfoProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
        <Music2 className="h-6 w-6 text-muted-foreground" />
      </div>
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
    </div>
  );
}

function Seeker() {
  const { media, playbackState, setSeek, getSeek } = useMediaStore(
    useShallow((state) => ({
      media: state.media,
      playbackState: state.playbackState,
      setSeek: state.setSeek,
      getSeek: state.getSeek,
    })),
  );

  const [displaySeek, setDisplaySeek] = useState(() => [getSeek()]);
  const [isSeeking, setIsSeeking] = useState(false);

  const audiofile = media?.audiofile;
  const duration = audiofile?.duration ? Math.round(audiofile.duration) : 0;

  useEffect(() => {
    if (isSeeking || playbackState !== "playing") return;

    const interval = setInterval(() => {
      setDisplaySeek([Math.floor(getSeek())]);
    }, 300);

    return () => clearInterval(interval);
  }, [playbackState, isSeeking, getSeek]);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const handleSeekChange = useCallback((value: number[]) => {
    setDisplaySeek(value);
  }, []);

  const handleSeekCommit = useCallback(
    (value: number[]) => {
      setSeek(value[0]);
    },
    [setSeek],
  );

  return (
    <div className="flex items-center gap-2 w-full text-xs">
      <span className="text-muted-foreground min-w-[2.5rem] font-mono">
        {formatDuration(displaySeek[0])}
      </span>

      <Slider
        className="flex-1"
        max={duration}
        min={0}
        step={1}
        value={displaySeek}
        onPointerDown={handleSeekStart}
        onPointerUp={handleSeekEnd}
        onValueChange={handleSeekChange}
        onValueCommit={handleSeekCommit}
        aria-label="Seek position"
      />

      <span className="text-muted-foreground min-w-[2.5rem] text-right font-mono">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
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
  const { volume, setVolume, mute, setMute } = useMediaStore(
    useShallow((state) => ({
      volume: state.volume,
      setVolume: state.setVolume,
      mute: state.mute,
      setMute: state.setMute,
    })),
  );

  const [localVolume, setLocalVolume] = useState([volume]);

  useEffect(() => {
    setLocalVolume([volume]);
  }, [volume]);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setLocalVolume(value);
      setVolume(value[0]);
    },
    [setVolume],
  );

  const toggleMute = useCallback(() => {
    setMute(!mute);
  }, [mute, setMute]);

  const VolumeIcon = mute ? VolumeX : Volume2;

  return (
    <div className="flex items-center gap-2">
      <ControlButton
        icon={<VolumeIcon className="h-5 w-5" />}
        onClick={toggleMute}
        aria-label={mute ? "Unmute" : "Mute"}
      />
      <Slider
        value={localVolume}
        onValueChange={handleVolumeChange}
        max={1}
        min={0}
        step={0.01}
        className="w-24"
        aria-label="Volume"
      />
    </div>
  );
}
