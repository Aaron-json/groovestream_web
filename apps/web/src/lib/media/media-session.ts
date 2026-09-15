import { useEffect } from "react";

import type { Audiofile } from "@groovestream/api/models";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import type { PlaybackState } from "@groovestream/media/player";

function reportActionError(action: MediaSessionAction, error: unknown) {
  console.error(`Media session ${action} action failed`, error);
}

function runAction(
  action: MediaSessionAction,
  command: () => void | Promise<void>,
) {
  try {
    Promise.resolve(command()).catch((error) =>
      reportActionError(action, error),
    );
  } catch (error) {
    reportActionError(action, error);
  }
}

function seekFromMediaSession(position: number) {
  const store = usePlaybackStore.getState();
  const playback = store.playerState;
  if (playback.status !== "playing" && playback.status !== "paused") return;
  if (!Number.isFinite(playback.duration)) return;

  const nextPosition = Math.min(Math.max(position, 0), playback.duration);
  runAction("seekto", () => store.seek(nextPosition));
}

function setPositionState(mediaSession: MediaSession, playback: PlaybackState) {
  if (typeof mediaSession.setPositionState !== "function") return;

  if (
    (playback.status !== "playing" && playback.status !== "paused") ||
    !Number.isFinite(playback.duration) ||
    playback.duration <= 0
  ) {
    mediaSession.setPositionState();
    return;
  }

  const position = Number.isFinite(playback.position)
    ? Math.min(Math.max(playback.position, 0), playback.duration)
    : 0;
  mediaSession.setPositionState({
    duration: playback.duration,
    playbackRate: 1,
    position,
  });
}

export function useMediaSession() {
  useEffect(() => {
    if (!("mediaSession" in navigator) || !("MediaMetadata" in window)) {
      return;
    }

    const mediaSession = navigator.mediaSession;
    const handlers: ReadonlyArray<
      readonly [MediaSessionAction, MediaSessionActionHandler]
    > = [
      [
        "play",
        () => runAction("play", () => usePlaybackStore.getState().play()),
      ],
      ["pause", () => usePlaybackStore.getState().pause()],
      [
        "nexttrack",
        () => runAction("nexttrack", () => usePlaybackStore.getState().next()),
      ],
      [
        "previoustrack",
        () =>
          runAction("previoustrack", () =>
            usePlaybackStore.getState().previous(),
          ),
      ],
      ["stop", () => usePlaybackStore.getState().unloadMedia()],
      [
        "seekto",
        ({ seekTime }) => {
          if (seekTime !== undefined) {
            seekFromMediaSession(seekTime);
          }
        },
      ],
    ];

    const registeredActions: MediaSessionAction[] = [];
    for (const [action, handler] of handlers) {
      try {
        mediaSession.setActionHandler(action, handler);
        registeredActions.push(action);
      } catch {
        // Individual actions are not implemented consistently across browsers.
      }
    }

    let currentAudiofile: Audiofile | null | undefined = null;
    let playbackState: MediaSessionPlaybackState | undefined;

    function syncMediaSession() {
      const playback = usePlaybackStore.getState().playerState;
      const audiofile = playback.currentMedia?.item.audiofile;

      if (audiofile !== currentAudiofile) {
        currentAudiofile = audiofile;
        mediaSession.metadata = audiofile
          ? new MediaMetadata({
              title: audiofile.title || audiofile.filename,
              artist: audiofile.artists?.join(", ") || undefined,
              album: audiofile.album || undefined,
              artwork: [
                {
                  src: "/favicon.svg",
                  type: "image/svg+xml",
                },
              ],
            })
          : null;
      }

      let nextPlaybackState: MediaSessionPlaybackState = "none";
      if (playback.status === "playing") {
        nextPlaybackState = "playing";
      } else if (playback.status === "paused") {
        nextPlaybackState = "paused";
      }
      if (playbackState !== nextPlaybackState) {
        playbackState = nextPlaybackState;
        mediaSession.playbackState = nextPlaybackState;
      }

      setPositionState(mediaSession, playback);
    }

    const unsubscribe = usePlaybackStore.subscribe(syncMediaSession);
    syncMediaSession();

    return () => {
      unsubscribe();
      for (const action of registeredActions) {
        mediaSession.setActionHandler(action, null);
      }
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
      if (typeof mediaSession.setPositionState === "function") {
        mediaSession.setPositionState();
      }
    };
  }, []);
}
