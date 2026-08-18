import type { Audiofile } from "@groovestream/api/models";
import { formatDuration } from "@groovestream/media/duration";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import type { AudioSource } from "@groovestream/media/source";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { getErrorMessage } from "@/lib/errors";

export function audiofileTitle(audiofile: Audiofile) {
  return audiofile.title?.trim() || audiofile.filename;
}

export function audiofileArtist(audiofile: Audiofile) {
  return audiofile.artists?.length
    ? audiofile.artists.join(", ")
    : "Unknown artist";
}

export function TrackRow({
  audiofile,
  source,
  index,
  showArtwork = true,
  className = "",
}: {
  audiofile: Audiofile;
  source: AudioSource;
  index?: number;
  showArtwork?: boolean;
  className?: string;
}) {
  const toast = useAppToast();
  const currentId = usePlaybackStore(
    (state) => state.playerState.currentMedia?.audiofile.id,
  );
  const playing = usePlaybackStore(
    (state) => state.playerState.status === "playing",
  );
  const preparingId = usePlaybackStore(
    (state) =>
      state.playerState.status === "loading"
        ? state.playerState.currentMedia.audiofile.id
        : undefined,
  );
  const active = currentId === audiofile.id;
  const preparing = preparingId === audiofile.id;

  const play = async () => {
    try {
      const { playPauseToggle, setMedia } = usePlaybackStore.getState();
      if (active) {
        await playPauseToggle();
        return;
      }
      const files = source.getAudiofiles();
      const trackIndex = files.findIndex(({ id }) => id === audiofile.id);
      await setMedia(source, trackIndex === -1 ? 0 : trackIndex);
    } catch (error) {
      toast.error(
        "Couldn't play this track",
        getErrorMessage(error, "The track could not be prepared"),
      );
    }
  };

  const durationFormatted = formatDuration(
    audiofile.duration === null ? null : audiofile.duration / 1000,
  );

  return (
    <Pressable
      onPress={() => void play()}
      disabled={preparing}
      accessibilityRole="button"
      accessibilityLabel={`${active && playing ? "Pause" : "Play"} ${audiofileTitle(audiofile)} by ${audiofileArtist(audiofile)}`}
      accessibilityState={{ selected: active, busy: preparing }}
      className={`mx-3 my-0.5 flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:bg-secondary/60 ${
        active ? "bg-secondary/80 border border-border" : "border border-transparent"
      } ${className}`}
    >
      {/* Index or Thumbnail */}
      {showArtwork ? (
        <View
          className={`h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary ${
            active ? "border border-primary/30" : ""
          }`}
        >
          {preparing ? (
            <ActivityIndicator size="small" colorClassName="accent-primary" />
          ) : (
            <AppIcon
              name={active && playing ? "volume-high" : active ? "pause" : "musical-note"}
              size={18}
              colorClassName={active ? "accent-primary" : "accent-muted-foreground"}
            />
          )}
        </View>
      ) : index !== undefined ? (
        <View className="h-9 w-6 shrink-0 items-center justify-center">
          {preparing ? (
            <ActivityIndicator size="small" colorClassName="accent-primary" />
          ) : active ? (
            <AppIcon
              name={playing ? "volume-high" : "pause"}
              size={16}
              colorClassName="accent-primary"
            />
          ) : (
            <Text className="text-xs font-semibold text-muted-foreground">
              {index + 1}
            </Text>
          )}
        </View>
      ) : null}

      {/* Info */}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          numberOfLines={1}
          className={`text-sm tracking-tight ${
            active ? "font-semibold text-primary" : "font-medium text-foreground"
          }`}
        >
          {audiofileTitle(audiofile)}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {audiofileArtist(audiofile)}
          {audiofile.album ? ` • ${audiofile.album}` : ""}
        </Text>
      </View>

      {/* Duration */}
      {durationFormatted ? (
        <Text className="font-mono text-xs text-muted-foreground">
          {durationFormatted}
        </Text>
      ) : null}
    </Pressable>
  );
}
