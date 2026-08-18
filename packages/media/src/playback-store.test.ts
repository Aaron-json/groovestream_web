import { deepStrictEqual, rejects, strictEqual } from "node:assert";
import { afterEach, test } from "node:test";
import type { Audiofile, Encoding } from "@groovestream/api/models";
import type { PlaybackItem } from "./encodings.ts";
import {
  toUnloadedPlaybackState,
  type CurrentMedia,
  type MediaPlayer,
  type PlaybackState,
} from "./player.ts";
import { usePlaybackStore } from "./playback-store.ts";
import type { AudioSource } from "./source.ts";

function createAudiofile(id: string): Audiofile {
  return {
    album: null,
    artists: null,
    channels: 2,
    duration: 180_000,
    filename: `${id}.m4a`,
    genre: null,
    id,
    object_id: `${id}.object`,
    playlist_id: "playlist-id",
    title: id,
    track_number: null,
    track_total: null,
    uploaded_at: "2026-01-01T00:00:00Z",
    uploaded_by_id: "user-id",
    uploaded_by_username: "user",
  };
}

function createPlaybackItem(audiofileId: string): PlaybackItem {
  const encoding: Encoding = {
    audiofile_id: audiofileId,
    base_file_id: `${audiofileId}.file`,
    base_file_size: 1_000,
    bitrate: 256_000,
    channels: 2,
    codec: "aac",
    container: "mp4",
    created_at: "2026-01-01T00:00:00Z",
    dash_manifest_id: null,
    fragment_duration: 2,
    hls_manifest_id: `${audiofileId}.m3u8`,
    id: `${audiofileId}.encoding`,
    objects_prefix: audiofileId,
    sample_rate: 48_000,
  };
  return {
    encoding,
    delivery: "hls",
    objectId: encoding.hls_manifest_id!,
  };
}

function createSource(initialAudiofiles: readonly Audiofile[]) {
  let audiofiles = initialAudiofiles;
  let loading = false;
  let hasMore = false;
  const listeners = new Set<() => void>();
  const source: AudioSource = {
    getAudiofiles: () => audiofiles,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pagination: {
      hasMore: () => hasMore,
      isLoading: () => loading,
      loadMore: async () => {
        loading = true;
        listeners.forEach((listener) => listener());
        audiofiles = [...audiofiles, createAudiofile("loaded-later")];
        hasMore = false;
        loading = false;
        listeners.forEach((listener) => listener());
      },
    },
  };

  return {
    source,
    replace(nextAudiofiles: readonly Audiofile[]) {
      audiofiles = nextAudiofiles;
      listeners.forEach((listener) => listener());
    },
    setHasMore(nextHasMore: boolean) {
      hasMore = nextHasMore;
      listeners.forEach((listener) => listener());
    },
  };
}

class FakePlayer implements MediaPlayer {
  destroyCalls = 0;
  initCalls = 0;
  loadCalls: Audiofile["id"][] = [];
  nextError: Error | undefined;
  previousError: Error | undefined;
  private readonly listeners = new Set<() => void>();
  private state: PlaybackState = {
    status: "unloaded",
    currentMedia: undefined,
    position: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
  };

  get listenerCount() {
    return this.listeners.size;
  }

  isSupported() {
    return true;
  }

  async init() {
    this.initCalls++;
  }

  getState() {
    return this.state;
  }

  subscribeToState(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: PlaybackState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  async load(source: AudioSource, audiofileId: Audiofile["id"]) {
    this.loadCalls.push(audiofileId);
    const audiofiles = source.getAudiofiles();
    const index = audiofiles.findIndex(({ id }) => id === audiofileId);
    const audiofile = audiofiles[index];
    if (!audiofile) throw new Error("Missing fake audiofile");
    this.setState({
      status: "loading",
      currentMedia: {
        source,
        index,
        audiofile,
        playbackItem: undefined,
      },
      position: 0,
      duration: 0,
      volume: this.state.volume,
      muted: this.state.muted,
    });
  }

  commitLoad() {
    if (this.state.status !== "loading") {
      throw new Error("Nothing is loading");
    }
    this.setState({
      ...this.state,
      status: "playing",
      currentMedia: {
        ...this.state.currentMedia,
        playbackItem: createPlaybackItem(this.state.currentMedia.audiofile.id),
      },
    });
  }

  async next() {
    if (this.nextError) throw this.nextError;
  }

  async previous() {
    if (this.previousError) throw this.previousError;
  }

  unload() {
    this.setState(toUnloadedPlaybackState(this.state));
  }

  async destroy() {
    this.destroyCalls++;
    this.unload();
  }

  async play() {
    if (this.state.status === "paused") {
      this.setState({ ...this.state, status: "playing" });
    }
  }

  pause() {
    if (this.state.status === "playing") {
      this.setState({ ...this.state, status: "paused" });
    }
  }

  setVolume(volume: number) {
    this.setState({ ...this.state, volume });
  }

  setMute(muted: boolean) {
    this.setState({ ...this.state, muted });
  }

  async seek(position: number) {
    this.setState({ ...this.state, position });
  }
}

afterEach(async () => {
  await usePlaybackStore.getState().destroy();
});

test("mirrors the player-owned selection and hydrated playback item", async () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const liveSource = createSource([first]);
  const player = new FakePlayer();
  const changed: CurrentMedia[] = [];

  await usePlaybackStore.getState().init(player, {
    onMediaChange: (media) => changed.push(media),
  });
  liveSource.replace([first, second]);
  await usePlaybackStore.getState().setMedia(liveSource.source, 1);

  strictEqual(player.loadCalls[0], second.id);
  const loading = usePlaybackStore.getState().playerState;
  strictEqual(loading.status, "loading");
  if (loading.status !== "loading") throw new Error("Expected loading state");
  strictEqual(loading.currentMedia.audiofile, second);
  strictEqual(loading.currentMedia.playbackItem, undefined);
  deepStrictEqual(usePlaybackStore.getState().sourceAudiofiles, [first, second]);

  player.commitLoad();
  const playing = usePlaybackStore.getState().playerState;
  strictEqual(playing.status, "playing");
  if (playing.status !== "playing") throw new Error("Expected playing state");
  strictEqual(playing.currentMedia.source, liveSource.source);
  strictEqual(playing.currentMedia.audiofile, second);
  strictEqual(
    playing.currentMedia.playbackItem.encoding.audiofile_id,
    second.id,
  );
  strictEqual(changed.length, 1);
});

test("derives rendering snapshots and pagination from the live source", async () => {
  const first = createAudiofile("first");
  const liveSource = createSource([first]);
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  await usePlaybackStore.getState().setMedia(liveSource.source);
  player.commitLoad();
  liveSource.setHasMore(true);

  strictEqual(usePlaybackStore.getState().sourceHasMore, true);
  await usePlaybackStore.getState().loadMore();
  deepStrictEqual(
    usePlaybackStore.getState().sourceAudiofiles.map(({ id }) => id),
    ["first", "loaded-later"],
  );
  strictEqual(usePlaybackStore.getState().sourceHasMore, false);
  strictEqual(usePlaybackStore.getState().sourceLoadingMore, false);
});

test("preserves player intrinsics through phase changes", async () => {
  const first = createAudiofile("first");
  const liveSource = createSource([first]);
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  usePlaybackStore.getState().setVolume(0.35);
  usePlaybackStore.getState().setMute(true);
  await usePlaybackStore.getState().setMedia(liveSource.source);

  const loading = usePlaybackStore.getState().playerState;
  strictEqual(loading.volume, 0.35);
  strictEqual(loading.muted, true);
  player.commitLoad();
  strictEqual(usePlaybackStore.getState().playerState.volume, 0.35);
  strictEqual(usePlaybackStore.getState().playerState.muted, true);
});

test("treats cancellation as control flow but preserves real command errors", async () => {
  const player = new FakePlayer();
  await usePlaybackStore.getState().init(player);

  player.nextError = Object.assign(new Error("replaced"), {
    name: "AbortError",
  });
  await usePlaybackStore.getState().next();

  player.previousError = new Error("native failure");
  await rejects(usePlaybackStore.getState().previous(), /native failure/);
});

test("reinitializing the active player only replaces store effects", async () => {
  const audiofile = createAudiofile("first");
  const liveSource = createSource([audiofile]);
  const player = new FakePlayer();
  let firstEffectCalls = 0;
  let latestEffectCalls = 0;

  await usePlaybackStore.getState().init(player, {
    onMediaChange: () => firstEffectCalls++,
  });
  await usePlaybackStore.getState().init(player, {
    onMediaChange: () => latestEffectCalls++,
  });
  await usePlaybackStore.getState().setMedia(liveSource.source);
  player.commitLoad();

  strictEqual(player.initCalls, 1);
  strictEqual(player.destroyCalls, 0);
  strictEqual(firstEffectCalls, 0);
  strictEqual(latestEffectCalls, 1);
});

test("destroy removes the player state subscription", async () => {
  const player = new FakePlayer();
  await usePlaybackStore.getState().init(player);
  strictEqual(player.listenerCount, 1);

  await usePlaybackStore.getState().destroy();
  strictEqual(player.listenerCount, 0);
});
