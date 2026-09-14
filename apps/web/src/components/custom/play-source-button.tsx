import { LoaderCircle, Pause, Play } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

import { usePlaybackStore } from "@groovestream/media/playback-store";
import {
  getAudioSourcePosition,
  type AudioSource,
} from "@groovestream/media/source";

import { Button } from "@/components/ui/button";

type PlaySourceButtonProps = {
  source: AudioSource;
  sourceName: string;
};

export function PlaySourceButton({
  source,
  sourceName,
}: PlaySourceButtonProps) {
  const { currentMedia, playbackState, setMedia, playPauseToggle } =
    usePlaybackStore(
      useShallow((state) => ({
        currentMedia: state.playerState.currentMedia,
        playbackState: state.playerState.status,
        setMedia: state.setMedia,
        playPauseToggle: state.playPauseToggle,
      })),
    );

  const isCurrentSource = currentMedia?.source === source;
  const isPlaying = isCurrentSource && playbackState === "playing";
  const isLoading = isCurrentSource && playbackState === "loading";
  const label = isLoading ? "Loading" : isPlaying ? "Pause" : "Play all";

  async function handleClick() {
    try {
      if (isCurrentSource) {
        await playPauseToggle();
        return;
      }

      const firstPosition = getAudioSourcePosition(source, 0);
      if (!firstPosition) {
        toast.error("No tracks available");
        return;
      }

      await setMedia(firstPosition);
    } catch (error) {
      toast.error("Playback Error", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleClick()}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={
        isLoading
          ? `Loading ${sourceName}`
          : isPlaying
            ? `Pause ${sourceName}`
            : `Play all from ${sourceName}`
      }
    >
      {isLoading ? (
        <LoaderCircle className="animate-spin" />
      ) : isPlaying ? (
        <Pause />
      ) : (
        <Play className="translate-x-px" />
      )}
      {label}
    </Button>
  );
}
