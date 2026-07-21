import type { InfiniteData } from "@tanstack/react-query";
import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
} from "@tanstack/react-query";
import {
  deleteAudioFile,
  deletePlaylist,
  getAudioFileHistory,
  getMostPlayedAudioFiles,
  getPlaylistAudiofiles,
  getPlaylistInfo,
  getPlaylistInvites,
  getCloudTasks,
  getUserPlaylists,
  leavePlaylist,
  uploadAudiofile,
  Playlist,
  Audiofile,
} from "../api/requests/media";
import { MediaTask, NewMediaTask, TaskType, useTaskStore } from "@/lib/tasks";
import { queryClient } from "@/lib/query";

import type { AudiofileSource } from "@/lib/media/types";
import type { components } from "@/api/types/schema";

type HistoryItem = components["schemas"]["GetListeningHistoryRow"];
type HistoryMutationItem = components["schemas"]["GetListeningHistoryInfoRow"];
type PlaylistInvite = components["schemas"]["PlaylistInviteView"];
type AudiofilePage = components["schemas"]["PaginationAudiofileView"];
type HistoryPage = components["schemas"]["PaginationGetListeningHistoryRow"];
type PlaylistPage = components["schemas"]["PaginationPlaylistView"];
type PlaylistInvitePage = components["schemas"]["PaginationPlaylistInviteView"];

const PLAYLISTS_KEY = ["playlists"] as const;
export const PLAYLISTS_LIST_KEY = [...PLAYLISTS_KEY, "list"] as const;
export const PLAYLIST_INVITES_KEY = ["playlistInvites"] as const;
export const MOST_PLAYED_KEY = ["most-played"] as const;
export const LISTENING_HISTORY_KEY = ["listening-history"] as const;

export function getPlaylistKey(playlistId: Playlist["id"]) {
  return ["playlist", playlistId] as const;
}

export function getPlaylistAudiofilesKey(playlistId: Playlist["id"]) {
  return [...getPlaylistKey(playlistId), "audiofiles"] as const;
}

// Page sizes are part of each query's cache contract and are intentionally
// owned here rather than exposed to callers. Infinite-query pages include
// cursor boundaries derived from the requested size, so allowing multiple
// sizes would create separate caches for the same logical list—or, without
// distinct keys, reuse pagination state produced with a different size.
const PLAYLIST_PAGE_SIZE = 50;
const PLAYLIST_AUDIOFILES_PAGE_SIZE = 100;
const MOST_PLAYED_LIMIT = 10;
const LISTENING_HISTORY_PAGE_SIZE = 10;
const PLAYLIST_INVITES_PAGE_SIZE = 20;

// Extracts the items from each page into one list.
export function flattenInfiniteData<TData, TParam, TItem>(
  data: InfiniteData<TData, TParam>,
  extractor: (page: TData) => readonly TItem[],
): TItem[] {
  return data.pages.flatMap((page) => extractor(page));
}

function removeInfiniteItems<
  TItem,
  TPage extends { data: TItem[] | null },
  TPageParam,
>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  shouldRemove: (item: TItem) => boolean,
): InfiniteData<TPage, TPageParam> | undefined {
  if (!data) return undefined;

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data?.filter((item) => !shouldRemove(item)) ?? null,
    })),
  };
}

function prependInfiniteItem<
  TItem,
  TPage extends { data: TItem[] | null },
  TPageParam,
>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  item: TItem,
  isSameItem: (existing: TItem) => boolean,
): InfiniteData<TPage, TPageParam> | undefined {
  const withoutItem = removeInfiniteItems(data, isSameItem);
  if (!withoutItem || withoutItem.pages.length === 0) return withoutItem;

  const [firstPage, ...remainingPages] = withoutItem.pages;
  return {
    ...withoutItem,
    pages: [
      {
        ...firstPage,
        data: [item, ...(firstPage.data ?? [])],
      },
      ...remainingPages,
    ],
  };
}

export function addPlaylistToCache(playlist: Playlist) {
  queryClient.setQueryData<InfiniteData<PlaylistPage>>(
    PLAYLISTS_LIST_KEY,
    (data) =>
      prependInfiniteItem(data, playlist, (item) => item.id === playlist.id),
  );
}

function removePlaylistFromCache(playlistId: Playlist["id"]) {
  queryClient.setQueryData<InfiniteData<PlaylistPage>>(
    PLAYLISTS_LIST_KEY,
    (data) =>
      removeInfiniteItems<Playlist, PlaylistPage, unknown>(
        data,
        (playlist) => playlist.id === playlistId,
      ),
  );

  removeAudiofilesFromDerivedCaches(
    (audiofile) => audiofile.playlist_id === playlistId,
  );
  queryClient.removeQueries({ queryKey: getPlaylistKey(playlistId) });
}

function removeAudiofileFromCache(audiofile: Audiofile) {
  queryClient.setQueriesData<InfiniteData<AudiofilePage>>(
    { queryKey: getPlaylistAudiofilesKey(audiofile.playlist_id) },
    (data) =>
      removeInfiniteItems<Audiofile, AudiofilePage, unknown>(
        data,
        (item) => item.id === audiofile.id,
      ),
  );
  removeAudiofilesFromDerivedCaches((item) => item.id === audiofile.id);
}

function removeAudiofilesFromDerivedCaches(
  shouldRemove: (audiofile: Audiofile) => boolean,
) {
  queryClient.setQueriesData<Audiofile[]>(
    { queryKey: MOST_PLAYED_KEY },
    (data) => data?.filter((audiofile) => !shouldRemove(audiofile)),
  );
  queryClient.setQueriesData<InfiniteData<HistoryPage>>(
    { queryKey: LISTENING_HISTORY_KEY },
    (data) => removeInfiniteItems(data, shouldRemove),
  );
}

export function removePlaylistInviteFromCache(invite: PlaylistInvite) {
  queryClient.setQueriesData<InfiniteData<PlaylistInvitePage>>(
    { queryKey: PLAYLIST_INVITES_KEY },
    (data) =>
      removeInfiniteItems<PlaylistInvite, PlaylistInvitePage, unknown>(
        data,
        (item) => item.id === invite.id,
      ),
  );
}

export function addListeningHistoryToCache(item: HistoryMutationItem) {
  queryClient.setQueriesData<InfiniteData<HistoryPage>>(
    { queryKey: LISTENING_HISTORY_KEY },
    (data) =>
      prependInfiniteItem<HistoryItem, HistoryPage, unknown>(
        data,
        item,
        (existing) => existing.id === item.id,
      ),
  );
}

export function invalidateMostPlayed() {
  return queryClient.invalidateQueries({ queryKey: MOST_PLAYED_KEY });
}

export function playlistAudiofilesOptions(playlist_id: Playlist["id"]) {
  return infiniteQueryOptions({
    queryKey: getPlaylistAudiofilesKey(playlist_id),
    queryFn: ({ pageParam }) =>
      getPlaylistAudiofiles(
        { playlist_id },
        {
          limit: PLAYLIST_AUDIOFILES_PAGE_SIZE,
          cursor: pageParam,
        },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

function getCachedPlaylistAudiofiles(playlist_id: Playlist["id"]): Audiofile[] {
  const data = queryClient.getQueryData<
    InfiniteData<Awaited<ReturnType<typeof getPlaylistAudiofiles>>>
  >(playlistAudiofilesOptions(playlist_id).queryKey);
  if (!data) return [];
  return flattenInfiniteData(data, (page) => page.data ?? []);
}

export function createPlaylistAudiofileSource(
  playlist_id: Playlist["id"],
): AudiofileSource {
  return {
    queryKey: playlistAudiofilesOptions(playlist_id).queryKey,
    getAudiofiles: () => getCachedPlaylistAudiofiles(playlist_id),
  };
}

export function playlistInfoOptions(playlist_id: Playlist["id"]) {
  return queryOptions({
    queryKey: ["playlist", playlist_id, "metadata"],
    queryFn: () => getPlaylistInfo({ playlist_id }),
  });
}

export function playlistsListOptions() {
  return infiniteQueryOptions({
    queryKey: PLAYLISTS_LIST_KEY,
    queryFn: ({ pageParam }) =>
      getUserPlaylists({
        limit: PLAYLIST_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

export function getCachedPlaylistsList(): Playlist[] {
  const data = queryClient.getQueryData<
    InfiniteData<Awaited<ReturnType<typeof getUserPlaylists>>>
  >(playlistsListOptions().queryKey);
  if (!data) return [];

  return flattenInfiniteData(data, (page) => page.data ?? []);
}

export function mostPlayedOptions() {
  return queryOptions({
    queryKey: MOST_PLAYED_KEY,
    queryFn: () => getMostPlayedAudioFiles({ limit: MOST_PLAYED_LIMIT }),
  });
}

function getCachedMostPlayedAudiofiles(): Audiofile[] {
  const data = queryClient.getQueryData<
    Awaited<ReturnType<typeof getMostPlayedAudioFiles>>
  >(mostPlayedOptions().queryKey);
  return data ?? [];
}

export function createMostPlayedAudiofileSource(): AudiofileSource {
  return {
    queryKey: mostPlayedOptions().queryKey,
    getAudiofiles: getCachedMostPlayedAudiofiles,
  };
}

export function listeningHistoryOptions() {
  return infiniteQueryOptions({
    queryKey: LISTENING_HISTORY_KEY,
    queryFn: ({ pageParam }) =>
      getAudioFileHistory({
        limit: LISTENING_HISTORY_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

function getCachedListeningHistoryAudiofiles(): Audiofile[] {
  const data = queryClient.getQueryData<
    InfiniteData<Awaited<ReturnType<typeof getAudioFileHistory>>>
  >(listeningHistoryOptions().queryKey);
  if (!data) return [];
  return flattenInfiniteData(data, (page) => page.data ?? []);
}

export function createListeningHistoryAudiofileSource(): AudiofileSource {
  return {
    queryKey: listeningHistoryOptions().queryKey,
    getAudiofiles: getCachedListeningHistoryAudiofiles,
  };
}

export function cloudTasksOptions() {
  return queryOptions({
    queryKey: ["cloud-tasks"],
    queryFn: getCloudTasks,
  });
}

export function playlistInvitesOptions() {
  return infiniteQueryOptions({
    queryKey: PLAYLIST_INVITES_KEY,
    queryFn: ({ pageParam }) =>
      getPlaylistInvites({
        limit: PLAYLIST_INVITES_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

function genTaskId() {
  if (window.isSecureContext) {
    return crypto.randomUUID();
  } else {
    // fallback for browser versions that do not consider
    // locally served content as secure contexts. (Ex. Firefox versions before 84)
    return `${Date.now().toString()}-${Math.round(Math.random() * 1000).toString()}`;
  }
}

export function useUploadAudioFile() {
  const setTask = useTaskStore((state) => state.setTask);
  const removeTask = useTaskStore((state) => state.removeTask);

  return async function (files: File[], playlist: Playlist) {
    const failures: Array<{ file: File; error: unknown }> = [];

    for (const file of files) {
      let taskId: string | undefined;
      try {
        const id = genTaskId();
        taskId = id;
        const title = `Uploading "${file.name}"`;
        const task = NewMediaTask(title);
        setTask(id, task);
        await uploadAudiofile(file, playlist.id, {
          onProgress: (current, total) => {
            const newTask: MediaTask = {
              ...task,
              progress: {
                current,
                total,
                unit: "bytes",
              },
            };
            setTask(id, newTask);
          },
        });
        queryClient.invalidateQueries({
          queryKey: cloudTasksOptions().queryKey,
        });
      } catch (error) {
        failures.push({ file, error });
      } finally {
        if (taskId) removeTask(taskId);
      }
    }

    return { failures };
  };
}

export function useDeleteAudiofile() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);

  return useMutation({
    mutationFn: (audiofile: Audiofile) =>
      deleteAudioFile({ audiofile_id: audiofile.id }),
    onMutate: async (audiofile) => {
      const taskId = genTaskId();
      const task: MediaTask = {
        type: TaskType.MediaTask,
        title: "Deleting audio: " + audiofile.filename,
        media: audiofile,
      };
      setTask(taskId, task);

      return { taskId };
    },
    onSuccess: (_data, audiofile) => {
      removeAudiofileFromCache(audiofile);
    },
    onSettled: (_data, _error, _audiofile, context) => {
      if (context?.taskId) {
        removeTask(context.taskId);
      }
    },
  });
}

// Hook used to delete a playlist. It integrates with the task store
export function useDeletePlaylist() {
  const removeTask = useTaskStore((state) => state.removeTask);
  const setTask = useTaskStore((state) => state.setTask);

  return useMutation({
    mutationFn: (playlist: Playlist) =>
      deletePlaylist({ playlist_id: playlist.id }),
    onMutate: async (playlist) => {
      const taskId = genTaskId();
      const task: MediaTask = {
        type: TaskType.MediaTask,
        title: `Deleting playlist "${playlist.name}"`,
        media: playlist,
      };
      setTask(taskId, task);

      return { taskId };
    },
    onSuccess: (_data, playlist) => {
      removePlaylistFromCache(playlist.id);
    },
    onSettled: (_data, _error, _playlist, context) => {
      if (context?.taskId) {
        removeTask(context.taskId);
      }
    },
  });
}

export function useLeavePlaylist() {
  return useMutation({
    mutationFn: (playlist: Playlist) =>
      leavePlaylist({ playlist_id: playlist.id }),
    onSuccess: (_data, playlist) => {
      removePlaylistFromCache(playlist.id);
    },
  });
}
