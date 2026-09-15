import { useEffect } from "react";

import { usePlaybackStore } from "@groovestream/media/playback-store";
import type {
  AudioSource,
  AudioSourceItem,
} from "@groovestream/media/source";
import {
  LISTENING_HISTORY_SOURCE_ID,
  recordListeningHistory,
} from "@groovestream/query/media";

import { queryClient } from "@/lib/query";

export function useListeningHistoryRecorder() {
  useEffect(() => {
    let lastRecordedSourceId: AudioSource["id"] | undefined;
    let lastRecordedItemId: AudioSourceItem["id"] | undefined;

    return usePlaybackStore.subscribe((state) => {
      const playback = state.playerState;
      if (playback.status === "unloaded") {
        lastRecordedSourceId = undefined;
        lastRecordedItemId = undefined;
        return;
      }
      if (playback.status !== "playing") return;

      const { source, item } = playback.currentMedia;
      if (source.id === LISTENING_HISTORY_SOURCE_ID) {
        lastRecordedSourceId = undefined;
        lastRecordedItemId = undefined;
        return;
      }
      if (source.id === lastRecordedSourceId && item.id === lastRecordedItemId) {
        return;
      }

      lastRecordedSourceId = source.id;
      lastRecordedItemId = item.id;
      recordListeningHistory(queryClient, item.audiofile.id).catch(
        (error) => console.error("Unable to record listening history", error),
      );
    });
  }, []);
}
