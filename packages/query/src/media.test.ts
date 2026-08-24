import { deepStrictEqual, notStrictEqual, strictEqual } from "node:assert";
import { test } from "node:test";
import { QueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Audiofile, AudiofilePage } from "@groovestream/api/models";
import {
  createPlaylistAudiofileSource,
  playlistAudiofilesOptions,
  removeAudiofileFromCache,
} from "./media.ts";

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

function createPage(audiofiles: Audiofile[]): AudiofilePage {
  return { data: audiofiles, has_more: false };
}

test("playlist sources reuse flattened snapshots until audiofiles change", () => {
  const queryClient = new QueryClient();
  const playlistId = "playlist-id";
  const queryKey = playlistAudiofilesOptions(playlistId).queryKey;
  const source = createPlaylistAudiofileSource(queryClient, playlistId);
  const first = createAudiofile("first");
  const second = createAudiofile("second");

  queryClient.setQueryData<InfiniteData<AudiofilePage>>(queryKey, {
    pages: [createPage([first])],
    pageParams: [undefined],
  });

  const firstSnapshot = source.getAudiofiles();
  strictEqual(source.getAudiofiles(), firstSnapshot);
  deepStrictEqual(firstSnapshot, [first]);

  queryClient.setQueryData<InfiniteData<AudiofilePage>>(queryKey, (data) => {
    if (!data) throw new Error("Expected playlist data in the query cache");
    return { ...data, pageParams: ["refreshed"] };
  });
  strictEqual(source.getAudiofiles(), firstSnapshot);

  queryClient.setQueryData<InfiniteData<AudiofilePage>>(queryKey, (data) => {
    if (!data) throw new Error("Expected playlist data in the query cache");
    return {
      pages: [...data.pages, createPage([second])],
      pageParams: [...data.pageParams, "next-page"],
    };
  });

  const updatedSnapshot = source.getAudiofiles();
  notStrictEqual(updatedSnapshot, firstSnapshot);
  strictEqual(source.getAudiofiles(), updatedSnapshot);
  deepStrictEqual(updatedSnapshot, [first, second]);
});

test("cache removal only replaces data when an item matches", () => {
  const queryClient = new QueryClient();
  const playlistId = "playlist-id";
  const queryKey = playlistAudiofilesOptions(playlistId).queryKey;
  const first = createAudiofile("first");
  const initialData: InfiniteData<AudiofilePage> = {
    pages: [createPage([first])],
    pageParams: [undefined],
  };
  queryClient.setQueryData(queryKey, initialData);

  removeAudiofileFromCache(queryClient, createAudiofile("missing"));

  strictEqual(queryClient.getQueryData(queryKey), initialData);

  removeAudiofileFromCache(queryClient, first);

  const updatedData = queryClient.getQueryData<InfiniteData<AudiofilePage>>(
    queryKey,
  );
  notStrictEqual(updatedData, initialData);
  deepStrictEqual(updatedData?.pages[0]?.data, []);
});
