import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music2,
  ListMusic,
} from "lucide-react";
import { mediaContext } from "@/contexts/media";
import { formatDuration } from "@/lib/media";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MediaBar() {
  const mediaCtx = useContext(mediaContext);
  if (!mediaCtx) {
    throw new Error("Media context not found");
  }
  const [_volume, _setVolume] = React.useState([mediaCtx.volume]);
  const isMobile = useIsMobile();

  const controlButton = (icon: React.ReactNode, onClick = () => {}) => (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-primary shrink-0"
      onClick={onClick}
    >
      {icon}
    </Button>
  );

  const TrackInfo = () => (
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <div className="w-16 h-16 rounded flex items-center justify-center shrink-0">
        <Music2 className="w-full h-full text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium truncate">Track Name</h3>
        <p className="text-xs text-muted-foreground truncate">Artist Name</p>
      </div>
    </div>
  );

  const PlayControls = () => (
    <div className="flex items-center space-x-4">
      {controlButton(<Shuffle className="h-5 w-5" />)}
      {controlButton(<SkipBack className="h-5 w-5" />)}
      {controlButton(
        mediaCtx.playbackState === "playing" ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        ),
        mediaCtx.playPauseToggle,
      )}
      {controlButton(<SkipForward className="h-5 w-5" />)}
      {controlButton(<Repeat className="h-5 w-5" />)}
    </div>
  );

  const ProgressSlider = () => (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground w-full">
      <Seeker />
    </div>
  );

  const VolumeControl = () => (
    <div className="flex items-center space-x-2">
      {controlButton(
        mediaCtx.mute ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        ),
        () => mediaCtx.setMute(!mediaCtx.mute),
      )}
      <Slider
        value={_volume}
        onValueChange={(val) => mediaCtx.setVolume(val[0])}
        max={1}
        min={0}
        step={0.01}
        className="w-24"
      />
    </div>
  );
  return (
    <div
      className={`fixed z-50 bottom-2 left-2 right-2 bg-background border shadow-sm rounded-lg`}
    >
      {isMobile ? (
        <div className="w-full px-2 py-1.5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <TrackInfo />
              {controlButton(
                mediaCtx.playbackState === "playing" ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                ),
                mediaCtx.playPauseToggle,
              )}
            </div>
            <ProgressSlider />
          </div>
        </div>
      ) : (
        <div className="w-full px-4 py-3">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center space-x-4 min-w-0">
              <TrackInfo />
            </div>
            <div className="col-span-6 flex flex-col items-center space-y-2">
              <PlayControls />
              <ProgressSlider />
            </div>
            <div className="col-span-3 flex items-center justify-end space-x-4">
              {controlButton(<ListMusic className="h-5 w-5" />)}
              <VolumeControl />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Seeker() {
  const mediaCtx = useContext(mediaContext);
  if (!mediaCtx) {
    throw new Error("Playback Controls must be used within a media provider");
  }
  const { currentMedia, playbackState, setSeek, getSeek } = mediaCtx;
  const [displaySeek, setDisplaySeek] = useState([0]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (playbackState === "unloaded" || playbackState === "loading") {
      setDisplaySeek([0]);
    } else {
      timeout = setInterval(() => {
        setDisplaySeek([Math.round(getSeek())]);
      }, 1e3);
    }
    return () => clearInterval(timeout);
  }, [playbackState]);

  return (
    <div className="flex items-center gap-2 w-full px-2">
      <span className="text-gray-400 text-sm min-w-[40px]">
        {formatDuration(displaySeek[0])}
      </span>

      <Slider
        className="seeker flex-1"
        max={
          currentMedia && currentMedia.duration
            ? Math.round(currentMedia.duration)
            : 0
        }
        min={0}
        step={1}
        value={displaySeek}
        onValueChange={(val) => setDisplaySeek([val[0]])}
        onValueCommit={(val) => setSeek(val[0])}
      />

      <span className="text-gray-400 text-sm min-w-[40px] text-right">
        {currentMedia && currentMedia.duration
          ? formatDuration(Math.round(currentMedia.duration))
          : formatDuration(0)}
      </span>
    </div>
  );
}
