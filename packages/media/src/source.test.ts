import { strictEqual } from "node:assert";
import { test } from "node:test";
import type { Audiofile } from "@groovestream/api/models";
import {
  getAdjacentAudioSourcePosition,
  getAudioSourcePosition,
  reconcileAudioSourcePosition,
  type AudioSource,
  type AudioSourceItem,
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

function createItem(
  audiofile: Audiofile,
  id: string = audiofile.id,
): AudioSourceItem {
  return { id, audiofile };
}

function createSource(initialItems: readonly AudioSourceItem[]) {
  let snapshot: AudioSourceSnapshot = {
    items: initialItems,
    pagination: undefined,
  };
  const source: AudioSource = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
  };
  return {
    source,
    replace(nextItems: readonly AudioSourceItem[]) {
      snapshot = { items: nextItems, pagination: undefined };
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
  const liveSource = createSource([createItem(first)]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([createItem({ ...first })]);

  strictEqual(reconcileAudioSourcePosition(position), position);
});

test("refreshes metadata without changing a valid index", () => {
  const first = createAudiofile("first");
  const updated = { ...first, title: "Updated title" };
  const liveSource = createSource([createItem(first)]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([createItem(updated)]);
  const reconciled = reconcileAudioSourcePosition(position);

  strictEqual(reconciled?.index, 0);
  strictEqual(reconciled?.item.audiofile, updated);
});

test("repairs an index after the audiofile moves", () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const liveSource = createSource([createItem(first), createItem(second)]);
  const position = requirePosition(liveSource.source, 1);

  liveSource.replace([createItem(second), createItem(first)]);
  const reconciled = reconcileAudioSourcePosition(position);

  strictEqual(reconciled?.index, 0);
  strictEqual(reconciled?.item.audiofile, second);
});

test("returns undefined when the positioned audiofile was removed", () => {
  const first = createAudiofile("first");
  const liveSource = createSource([createItem(first)]);
  const position = requirePosition(liveSource.source, 0);

  liveSource.replace([]);

  strictEqual(reconcileAudioSourcePosition(position), undefined);
});

test("selects adjacent positions directly and wraps when requested", () => {
  const first = createAudiofile("first");
  const second = createAudiofile("second");
  const { source } = createSource([createItem(first), createItem(second)]);
  const firstPosition = requirePosition(source, 0);

  const secondPosition = getAdjacentAudioSourcePosition(firstPosition, "next");
  strictEqual(secondPosition?.index, 1);
  strictEqual(secondPosition?.item.audiofile, second);
  if (!secondPosition) throw new Error("Expected a next position");

  const wrapped = getAdjacentAudioSourcePosition(secondPosition, "next");
  strictEqual(wrapped?.index, 0);
  strictEqual(wrapped?.item.audiofile, first);
});

test("distinguishes duplicate audiofiles by source item ID", () => {
  const audiofile = createAudiofile("duplicate");
  const firstOccurrence = createItem(audiofile, "first-occurrence");
  const secondOccurrence = createItem(audiofile, "second-occurrence");
  const liveSource = createSource([firstOccurrence, secondOccurrence]);
  const position = requirePosition(liveSource.source, 1);

  liveSource.replace([secondOccurrence, firstOccurrence]);
  const reconciled = reconcileAudioSourcePosition(position);

  strictEqual(reconciled?.item.id, secondOccurrence.id);
  strictEqual(reconciled?.index, 0);
  strictEqual(reconciled?.item.audiofile, audiofile);
});
