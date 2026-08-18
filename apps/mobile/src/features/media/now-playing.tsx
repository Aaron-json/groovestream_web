import { FlashList } from "@shopify/flash-list";
import { formatDuration } from "@groovestream/media/duration";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import { getErrorMessage } from "@/lib/errors";
import { audiofileArtist, audiofileTitle } from "./track-row";

function PlaybackProgress() {
  const toast = useAppToast();
  const position = usePlaybackStore((state) => state.playerState.position);
  const duration = usePlaybackStore((state) => state.playerState.duration);
  const seekMedia = usePlaybackStore((state) => state.seek);
  const [dragPosition, setDragPosition] = useState<number>();
  const shownPosition = dragPosition ?? position;
  const maximum = Math.max(duration, 1);

  const seek = async (value: number) => {
    try {
      await seekMedia(value);
    } catch (error) {
      toast.error(
        "Couldn't seek",
        getErrorMessage(error, "The playback position could not be changed"),
      );
    }
  };

  return (
    <View className="gap-1.5 py-1">
      <Slider
        value={Math.min(Math.max(shownPosition, 0), maximum)}
        minValue={0}
        maxValue={maximum}
        step={1}
        onChange={setDragPosition}
        onChangeEnd={(value) => {
          setDragPosition(undefined);
          void seek(value);
        }}
        accessibilityLabel="Playback position"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <View className="flex-row justify-between px-0.5">
        <Text className="font-mono text-xs text-muted-foreground">
          {formatDuration(shownPosition)}
        </Text>
        <Text className="font-mono text-xs text-muted-foreground">
          {formatDuration(duration)}
        </Text>
      </View>
    </View>
  );
}

function VolumeSlider() {
  const volume = usePlaybackStore((state) => state.playerState.volume);
  const mute = usePlaybackStore((state) => state.playerState.muted);
  const setVolume = usePlaybackStore((state) => state.setVolume);
  const setMute = usePlaybackStore((state) => state.setMute);

  return (
    <View className="flex-row items-center gap-3 px-2 py-1">
      <Pressable
        onPress={() => setMute(!mute)}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-accent"
        accessibilityLabel={mute ? "Unmute" : "Mute"}
      >
        <AppIcon
          name={mute || volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
          size={18}
          colorClassName="accent-muted-foreground"
        />
      </Pressable>
      <Slider
        className="flex-1"
        value={mute ? 0 : volume}
        minValue={0}
        maxValue={1}
        step={0.02}
        onChange={(v) => {
          if (mute) setMute(false);
          setVolume(v);
        }}
        accessibilityLabel="Volume"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
      <View className="h-8 w-8 items-center justify-center">
        <AppIcon
          name="volume-high"
          size={18}
          colorClassName="accent-muted-foreground"
        />
      </View>
    </View>
  );
}

export function NowPlaying() {
  const toast = useAppToast();
  const insets = useSafeAreaInsets();
  const media = usePlaybackStore((state) => state.playerState.currentMedia);
  const current = media?.audiofile;
  const sourceAudiofiles = usePlaybackStore((state) => state.sourceAudiofiles);
  const currentSourceIndex = media?.index;
  const playing = usePlaybackStore(
    (state) => state.playerState.status === "playing",
  );
  const preparing = usePlaybackStore(
    (state) => state.playerState.status === "loading",
  );
  const sourceHasMore = usePlaybackStore((state) => state.sourceHasMore);
  const sourceLoadingMore = usePlaybackStore((state) => state.sourceLoadingMore);
  const selectMedia = usePlaybackStore((state) => state.selectMedia);
  const previous = usePlaybackStore((state) => state.previous);
  const next = usePlaybackStore((state) => state.next);
  const playPauseToggle = usePlaybackStore((state) => state.playPauseToggle);
  const loadMoreMedia = usePlaybackStore((state) => state.loadMore);

  const upcoming = useMemo(
    () =>
      currentSourceIndex === undefined
        ? []
        : sourceAudiofiles.slice(currentSourceIndex + 1),
    [currentSourceIndex, sourceAudiofiles],
  );

  const [loadMoreError, setLoadMoreError] = useState<{
    audiofileId: string;
    message: string;
  }>();

  const currentLoadMoreError =
    loadMoreError && loadMoreError.audiofileId === current?.id
      ? loadMoreError.message
      : undefined;

  if (!current) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <View className="h-20 w-20 items-center justify-center rounded-2xl border border-border bg-secondary">
          <AppIcon
            name="musical-notes-outline"
            size={36}
            colorClassName="accent-muted-foreground"
          />
        </View>
        <Text className="text-sm font-medium text-muted-foreground">Choose something to play</Text>
      </View>
    );
  }

  const selectTrack = async (audiofileId: string) => {
    try {
      await selectMedia(audiofileId);
    } catch (error) {
      toast.error(
        "Couldn't play this track",
        getErrorMessage(error, "The track could not be prepared"),
      );
    }
  };

  const move = async (direction: "previous" | "next") => {
    try {
      if (direction === "previous") await previous();
      else await next();
    } catch (error) {
      toast.error(
        `Couldn't play the ${direction} track`,
        getErrorMessage(error, "The track could not be prepared"),
      );
    }
  };

  const loadMore = async () => {
    setLoadMoreError(undefined);
    try {
      await loadMoreMedia();
    } catch (error) {
      setLoadMoreError({
        audiofileId: current.id,
        message: getErrorMessage(error, "The next page could not be loaded"),
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-accent"
          accessibilityRole="button"
          accessibilityLabel="Dismiss now playing"
        >
          <AppIcon name="chevron-down" size={24} colorClassName="accent-foreground" />
        </Pressable>
        <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Now Playing
        </Text>
        <View className="h-10 w-10" />
      </View>

      <FlashList
        data={upcoming}
        keyExtractor={(audiofile) => audiofile.id}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (sourceHasMore && !sourceLoadingMore && !currentLoadMoreError) {
            void loadMore();
          }
        }}
        renderItem={({ item, index }) => (
          <Pressable
            disabled={preparing}
            onPress={() => void selectTrack(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Play ${audiofileTitle(item)}`}
            className="mx-4 my-1 flex-row items-center gap-3.5 rounded-xl px-3 py-2.5 active:bg-accent disabled:opacity-45"
          >
            <Text className="w-6 text-center font-mono text-xs text-muted-foreground">
              {(currentSourceIndex ?? 0) + index + 2}
            </Text>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                {audiofileTitle(item)}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {audiofileArtist(item)}
              </Text>
            </View>
            <AppIcon
              name="play"
              size={14}
              colorClassName="accent-muted-foreground"
            />
          </Pressable>
        )}
        ListHeaderComponent={
          <View className="gap-5 px-6 pb-4 pt-2">
            {/* Artwork Container */}
            <View className="mx-auto aspect-square w-full max-w-[320px] items-center justify-center rounded-2xl border border-border bg-secondary shadow-sm">
              <AppIcon name="musical-notes" size={64} colorClassName="accent-muted-foreground" />
            </View>

            {/* Track Info */}
            <View className="gap-1 pt-2">
              <Text numberOfLines={2} className="text-2xl font-bold tracking-tight text-foreground">
                {audiofileTitle(current)}
              </Text>
              <Text numberOfLines={1} className="text-base font-medium text-muted-foreground">
                {audiofileArtist(current)}
              </Text>
              {current.album ? (
                <View className="pt-1">
                  <Badge variant="secondary">{current.album}</Badge>
                </View>
              ) : null}
            </View>

            {/* Progress Seeker */}
            <PlaybackProgress />

            {/* Main Controls */}
            <View className="flex-row items-center justify-center gap-8 py-2">
              <Pressable
                className="h-12 w-12 items-center justify-center rounded-full active:bg-accent disabled:opacity-40"
                disabled={preparing}
                onPress={() => void move("previous")}
                accessibilityRole="button"
                accessibilityLabel="Previous track"
              >
                <AppIcon name="play-skip-back" size={24} colorClassName="accent-foreground" />
              </Pressable>

              <Pressable
                className="h-16 w-16 items-center justify-center rounded-full bg-primary active:scale-95 disabled:opacity-50 shadow-md shadow-primary/30"
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
                    size={30}
                    colorClassName="accent-primary-foreground"
                  />
                )}
              </Pressable>

              <Pressable
                className="h-12 w-12 items-center justify-center rounded-full active:bg-accent disabled:opacity-40"
                disabled={preparing}
                onPress={() => void move("next")}
                accessibilityRole="button"
                accessibilityLabel="Next track"
              >
                <AppIcon name="play-skip-forward" size={24} colorClassName="accent-foreground" />
              </Pressable>
            </View>

            {/* Volume Control */}
            <VolumeSlider />

            {/* Queue Header */}
            {upcoming.length > 0 || sourceHasMore ? (
              <View className="flex-row items-center justify-between pt-4 pb-1">
                <Text className="text-base font-bold tracking-tight text-foreground">
                  Up next
                </Text>
                <Badge variant="outline">{upcoming.length} tracks</Badge>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          currentLoadMoreError ? (
            <View className="items-center gap-2 p-4">
              <Text className="text-center text-xs text-destructive">
                {currentLoadMoreError}
              </Text>
              <Button variant="ghost" size="sm" onPress={() => void loadMore()}>
                <ButtonText>Try again</ButtonText>
              </Button>
            </View>
          ) : sourceLoadingMore ? (
            <ActivityIndicator className="my-4" colorClassName="accent-primary" />
          ) : null
        }
      />
    </View>
  );
}
