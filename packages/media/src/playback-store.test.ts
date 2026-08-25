import { rejects, strictEqual } from "node:assert";
import { afterEach, test } from "node:test";
import type { Audiofile, Encoding } from "@groovestream/api/models";
import type { PlaybackItem } from "./encodings.ts";
import {
  toUnloadedPlaybackState,
  type MediaPlayer,
  type PlaybackState,
} from "./player.ts";
import { usePlaybackStore } from "./playback-store.ts";
import {
  getAudioSourcePosition,
  type AudioSource,
  type AudioSourcePosition,
  type AudioSourceSnapshot,
} from "./source.ts";

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
  const objectId = `${audiofileId}.m3u8`;
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
    hls_manifest_id: objectId,
    id: `${audiofileId}.encoding`,
    objects_prefix: audiofileId,
    sample_rate: 48_000,
  };
  return {
    encoding,
    delivery: "hls",
    objectId,
  };
}

function createSource(initialAudiofiles: readonly Audiofile[]) {
  let snapshot: AudioSourceSnapshot = {
    audiofiles: initialAudiofiles,
    pagination: undefined,
  };
  const source: AudioSource = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
  };

  return {
    source,
    replace(nextAudiofiles: readonly Audiofile[]) {
      snapshot = { audiofiles: nextAudiofiles, pagination: undefined };
    },
  };
}

class FakePlayer implements MediaPlayer {
  destroyCalls = 0;
  initCalls = 0;
  loadCalls: AudioSourcePosition[] = [];
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

  async load(position: AudioSourcePosition) {
    this.loadCalls.push(position);
    this.setState({
      status: "loading",
      currentMedia: {
        ...position,
        playbackItem: undefined,
      },
      position: 0,
      duration: 0,
      volume: this.state.volume,
      muted: this.state.muted,
    });
  }

  completeLoad() {
    if (this.state.status !== "loading") {
      throw new Error("Nothing is loading");
    }
    this.setState({
      ...this.state,
      status: "paused",
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

function requirePosition(source: AudioSource, index = 0) {
  const position = getAudioSourcePosition(source, index);
  if (!position) throw new Error("Expected an audiofile at the test index");
  return position;
}

afterEach(async () => {
  await usePlaybackStore.getState().destroy();
});

test("mirrors loading, hydrated, and playing player states", async () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const liveSource = createSource([first]);
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  liveSource.replace([first, second]);
  await usePlaybackStore
    .getState()
    .setMedia(requirePosition(liveSource.source, 1));

  strictEqual(player.loadCalls[0].audiofile, second);
  strictEqual(player.loadCalls[0].index, 1);
  const loading = usePlaybackStore.getState().playerState;
  strictEqual(loading.status, "loading");
  if (loading.status !== "loading") throw new Error("Expected loading state");
  strictEqual(loading.currentMedia.audiofile, second);
  strictEqual(loading.currentMedia.playbackItem, undefined);

  player.completeLoad();
  const paused = usePlaybackStore.getState().playerState;
  strictEqual(paused.status, "paused");
  if (paused.status !== "paused") throw new Error("Expected paused state");
  strictEqual(paused.currentMedia.source, liveSource.source);
  strictEqual(paused.currentMedia.audiofile, second);
  strictEqual(
    paused.currentMedia.playbackItem.encoding.audiofile_id,
    second.id,
  );

  await player.play();
  strictEqual(usePlaybackStore.getState().playerState.status, "playing");
});

test("forwards source positions without duplicating player reconciliation", async () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const liveSource = createSource([first, second]);
  const position = requirePosition(liveSource.source, 1);
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  liveSource.replace([second, first]);
  await usePlaybackStore.getState().setMedia(position);

  strictEqual(player.loadCalls[0], position);
});

test("preserves player intrinsics through phase changes", async () => {
  const first = createAudiofile("first");
  const liveSource = createSource([first]);
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  usePlaybackStore.getState().setVolume(0.35);
  usePlaybackStore.getState().setMute(true);
  await usePlaybackStore
    .getState()
    .setMedia(requirePosition(liveSource.source));

  const loading = usePlaybackStore.getState().playerState;
  strictEqual(loading.volume, 0.35);
  strictEqual(loading.muted, true);
  player.completeLoad();
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

test("reinitializing the active player is idempotent", async () => {
  const player = new FakePlayer();

  await usePlaybackStore.getState().init(player);
  await usePlaybackStore.getState().init(player);

  strictEqual(player.initCalls, 1);
  strictEqual(player.destroyCalls, 0);
});

test("destroy removes the player state subscription", async () => {
  const player = new FakePlayer();
  await usePlaybackStore.getState().init(player);
  strictEqual(player.listenerCount, 1);

  await usePlaybackStore.getState().destroy();
  strictEqual(player.listenerCount, 0);
});
