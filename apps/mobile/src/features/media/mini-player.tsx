import { usePlaybackStore } from "@groovestream/media/playback-store";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { audiofileArtist, audiofileTitle } from "./track-row";

const TAB_BAR_HEIGHT = 54;

export function MiniPlayer() {
  const toast = useAppToast();
  const current = usePlaybackStore(
    (state) => state.playerState.currentMedia?.audiofile,
  );
  const playing = usePlaybackStore(
    (state) => state.playerState.status === "playing",
  );
  const preparing = usePlaybackStore(
    (state) => state.playerState.status === "loading",
  );
  const position = usePlaybackStore((state) => state.playerState.position);
  const duration = usePlaybackStore((state) => state.playerState.duration);
  const playPauseToggle = usePlaybackStore((state) => state.playPauseToggle);
  const next = usePlaybackStore((state) => state.next);
  const insets = useSafeAreaInsets();

  if (!current) return null;

  const playNext = async () => {
    try {
      await next();
    } catch (error) {
      toast.error(
        "Couldn't play the next track",
        getErrorMessage(error, "The track could not be prepared"),
      );
    }
  };

  const progressPercent =
    duration > 0 ? Math.min(Math.max((position / duration) * 100, 0), 100) : 0;

  return (
    <View
      className="absolute left-3 right-3 z-30 overflow-hidden rounded-2xl border border-border/90 bg-card/95 shadow-xl shadow-black/40"
      style={{ bottom: insets.bottom + TAB_BAR_HEIGHT + 4 }}
    >
      {/* Mini Progress Bar */}
      <View className="h-0.5 w-full bg-secondary">
        <View
          className="h-full bg-primary"
          style={{ width: `${progressPercent}%` }}
        />
      </View>

      <View className="h-16 flex-row items-center px-3.5 gap-3">
        {/* Artwork Icon */}
        <Pressable
          onPress={() => router.push("/now-playing")}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary"
        >
          <AppIcon
            name={playing ? "volume-high" : "musical-note"}
            size={20}
            colorClassName={playing ? "accent-primary" : "accent-muted-foreground"}
          />
        </Pressable>

        {/* Track Details */}
        <Pressable
          className="h-full min-w-0 flex-1 justify-center active:opacity-75"
          onPress={() => router.push("/now-playing")}
          accessibilityRole="button"
          accessibilityLabel={`Open now playing: ${audiofileTitle(current)}`}
        >
          <Text numberOfLines={1} className="text-sm font-bold text-card-foreground tracking-tight">
            {audiofileTitle(current)}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {audiofileArtist(current)}
          </Text>
        </Pressable>

        {/* Play/Pause Button */}
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full bg-primary active:scale-95 disabled:opacity-50 shadow-sm shadow-primary/30"
          disabled={preparing}
          onPress={() => void playPauseToggle()}
          accessibilityRole="button"
          accessibilityLabel={playing ? "Pause" : "Play"}
        >
          {preparing ? (
            <ActivityIndicator size="small" colorClassName="accent-primary-foreground" />
          ) : (
            <AppIcon
              name={playing ? "pause" : "play"}
              size={18}
              colorClassName="accent-primary-foreground"
            />
          )}
        </Pressable>

        {/* Next Button */}
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full active:bg-accent disabled:opacity-40"
          disabled={preparing}
          onPress={() => void playNext()}
          accessibilityRole="button"
          accessibilityLabel="Next track"
        >
          <AppIcon
            name="play-skip-forward"
            size={18}
            colorClassName="accent-foreground"
          />
        </Pressable>
      </View>
    </View>
  );
}

export const PLAYER_CONTENT_INSET = 88;
