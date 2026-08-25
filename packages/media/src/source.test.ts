import { strictEqual } from "node:assert";
import { test } from "node:test";
import type { Audiofile } from "@groovestream/api/models";
import {
  getAdjacentAudioSourcePosition,
  getAudioSourcePosition,
  reconcileAudioSourcePosition,
  type AudioSource,
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

function requirePosition(source: AudioSource, index: number) {
  const position = getAudioSourcePosition(source, index);
  if (!position) throw new Error("Expected an audiofile at the test index");
  return position;
}

test("keeps a shallow-equal source position without allocating", () => {
  const first = createAudiofile("first");
  const liveSource = createSource([first]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([{ ...first }]);

  strictEqual(reconcileAudioSourcePosition(position), position);
});

test("refreshes metadata without changing a valid index", () => {
  const first = createAudiofile("first");
  const updated = { ...first, title: "Updated title" };
  const liveSource = createSource([first]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([updated]);
  const reconciled = reconcileAudioSourcePosition(position);

  strictEqual(reconciled?.index, 0);
  strictEqual(reconciled?.audiofile, updated);
});

test("repairs an index after the audiofile moves", () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const liveSource = createSource([first, second]);
  const position = requirePosition(liveSource.source, 1);

  liveSource.replace([second, first]);
  const reconciled = reconcileAudioSourcePosition(position);

  strictEqual(reconciled?.index, 0);
  strictEqual(reconciled?.audiofile, second);
});

test("returns undefined when the positioned audiofile was removed", () => {
  const first = createAudiofile("first");
  const liveSource = createSource([first]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([]);

  strictEqual(reconcileAudioSourcePosition(position), undefined);
});

test("selects adjacent positions directly and wraps when requested", () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const { source } = createSource([first, second]);
  const firstPosition = requirePosition(source, 0);

  const secondPosition = getAdjacentAudioSourcePosition(firstPosition, "next");
  strictEqual(secondPosition?.index, 1);
  strictEqual(secondPosition?.audiofile, second);
  if (!secondPosition) throw new Error("Expected a next position");

  const wrapped = getAdjacentAudioSourcePosition(secondPosition, "next");
  strictEqual(wrapped?.index, 0);
  strictEqual(wrapped?.audiofile, first);
});
