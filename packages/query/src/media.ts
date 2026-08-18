import {
  InfiniteQueryObserver,
  QueryObserver,
  infiniteQueryOptions,
  queryOptions,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  addListeningHistory,
  getPlaylist,
  listListeningHistory,
  listMostPlayedAudiofiles,
  listPlaylistAudiofiles,
  listPlaylistInvites,
  listPlaylists,
} from "@groovestream/api/sdk";
import type {
  Audiofile,
  AudiofilePage,
  HistoryItem,
  HistoryMutationItem,
  HistoryPage,
  Playlist,
  PlaylistInvite,
  PlaylistInvitePage,
  PlaylistPage,
} from "@groovestream/api/models";
import type { AudioSource } from "@groovestream/media/source";

const PLAYLISTS_KEY = ["playlists"] as const;
export const PLAYLISTS_LIST_KEY = [...PLAYLISTS_KEY, "list"] as const;
const PLAYLIST_INVITES_KEY = ["playlistInvites"] as const;
const MOST_PLAYED_KEY = ["most-played"] as const;
const LISTENING_HISTORY_KEY = ["listening-history"] as const;

const PLAYLIST_PAGE_SIZE = 50;
const PLAYLIST_AUDIOFILES_PAGE_SIZE = 100;
const MOST_PLAYED_LIMIT = 10;
const LISTENING_HISTORY_PAGE_SIZE = 25;
const PLAYLIST_INVITES_PAGE_SIZE = 20;

export function getPlaylistKey(playlistId: Playlist["id"]) {
  return ["playlist", playlistId] as const;
}

export function getPlaylistAudiofilesKey(playlistId: Playlist["id"]) {
  return [...getPlaylistKey(playlistId), "audiofiles"] as const;
}

export function flattenInfiniteData<TData, TParam, TItem>(
  data: InfiniteData<TData, TParam>,
  getItems: (page: TData) => readonly TItem[],
): TItem[] {
  return data.pages.flatMap(getItems);
}

function removeInfiniteItems<
  TItem,
  TPage extends { data: TItem[] | null },
  TPageParam,
>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  shouldRemove: (item: TItem) => boolean,
) {
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
) {
  const withoutItem = removeInfiniteItems(data, isSameItem);
  if (!withoutItem || withoutItem.pages.length === 0) return withoutItem;

  const [firstPage, ...remainingPages] = withoutItem.pages;
  return {
    ...withoutItem,
    pages: [
      { ...firstPage, data: [item, ...(firstPage.data ?? [])] },
      ...remainingPages,
    ],
  };
}

export function playlistAudiofilesOptions(playlistId: Playlist["id"]) {
  return infiniteQueryOptions({
    queryKey: getPlaylistAudiofilesKey(playlistId),
    queryFn: ({ pageParam, signal }) =>
      listPlaylistAudiofiles({
        path: { playlist_id: playlistId },
        query: { limit: PLAYLIST_AUDIOFILES_PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

export function playlistInfoOptions(playlistId: Playlist["id"]) {
  return queryOptions({
    queryKey: [...getPlaylistKey(playlistId), "metadata"],
    queryFn: ({ signal }) =>
      getPlaylist({ path: { playlist_id: playlistId }, signal }),
  });
}

export function playlistsListOptions() {
  return infiniteQueryOptions({
    queryKey: PLAYLISTS_LIST_KEY,
    queryFn: ({ pageParam, signal }) =>
      listPlaylists({
        query: { limit: PLAYLIST_PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

export function mostPlayedOptions() {
  return queryOptions({
    queryKey: MOST_PLAYED_KEY,
    queryFn: ({ signal }) =>
      listMostPlayedAudiofiles({ query: { limit: MOST_PLAYED_LIMIT }, signal }),
  });
}

export function listeningHistoryOptions() {
  return infiniteQueryOptions({
    queryKey: LISTENING_HISTORY_KEY,
    queryFn: ({ pageParam, signal }) =>
      listListeningHistory({
        query: { limit: LISTENING_HISTORY_PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

export function playlistInvitesOptions() {
  return infiniteQueryOptions({
    queryKey: PLAYLIST_INVITES_KEY,
    queryFn: ({ pageParam, signal }) =>
      listPlaylistInvites({
        query: { limit: PLAYLIST_INVITES_PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.cursor : undefined,
  });
}

function cachedPlaylistAudiofiles(
  queryClient: QueryClient,
  playlistId: Playlist["id"],
) {
  const data = queryClient.getQueryData<InfiniteData<AudiofilePage>>(
    getPlaylistAudiofilesKey(playlistId),
  );
  return data ? flattenInfiniteData(data, (page) => page.data ?? []) : [];
}

export function createPlaylistAudiofileSource(
  queryClient: QueryClient,
  playlistId: Playlist["id"],
): AudioSource {
  const options = playlistAudiofilesOptions(playlistId);
  const observer = new InfiniteQueryObserver(queryClient, {
    ...options,
    enabled: false,
  });
  return {
    getAudiofiles: () => cachedPlaylistAudiofiles(queryClient, playlistId),
    subscribe: (listener) => observer.subscribe(listener),
    pagination: {
      hasMore: () => Boolean(observer.getCurrentResult().hasNextPage),
      isLoading: () => observer.getCurrentResult().isFetchingNextPage,
      loadMore: async () => {
        if (!observer.getCurrentResult().hasNextPage) return;
        const result = await observer.fetchNextPage({ cancelRefetch: false });
        if (result.isFetchNextPageError) throw result.error;
      },
    },
  };
}

export function createMostPlayedAudiofileSource(
  queryClient: QueryClient,
): AudioSource {
  const observer = new QueryObserver(queryClient, {
    ...mostPlayedOptions(),
    enabled: false,
  });
  return {
    getAudiofiles: () =>
      queryClient.getQueryData<Audiofile[] | null>(MOST_PLAYED_KEY) ?? [],
    subscribe: (listener) => observer.subscribe(listener),
  };
}

export function createListeningHistoryAudiofileSource(
  queryClient: QueryClient,
): AudioSource {
  const options = listeningHistoryOptions();
  const observer = new InfiniteQueryObserver(queryClient, {
    ...options,
    enabled: false,
  });
  return {
    getAudiofiles: () => {
      const data = queryClient.getQueryData<InfiniteData<HistoryPage>>(
        LISTENING_HISTORY_KEY,
      );
      return data ? flattenInfiniteData(data, (page) => page.data ?? []) : [];
    },
    subscribe: (listener) => observer.subscribe(listener),
    pagination: {
      hasMore: () => Boolean(observer.getCurrentResult().hasNextPage),
      isLoading: () => observer.getCurrentResult().isFetchingNextPage,
      loadMore: async () => {
        if (!observer.getCurrentResult().hasNextPage) return;
        const result = await observer.fetchNextPage({ cancelRefetch: false });
        if (result.isFetchNextPageError) throw result.error;
      },
    },
  };
}

export function addPlaylistToCache(
  queryClient: QueryClient,
  playlist: Playlist,
) {
  queryClient.setQueryData<InfiniteData<PlaylistPage>>(
    PLAYLISTS_LIST_KEY,
    (data) =>
      prependInfiniteItem(data, playlist, (item) => item.id === playlist.id),
  );
}

function removeAudiofilesFromDerivedCaches(
  queryClient: QueryClient,
  shouldRemove: (audiofile: Audiofile) => boolean,
) {
  queryClient.setQueryData<Audiofile[]>(MOST_PLAYED_KEY, (data) =>
    data?.filter((audiofile) => !shouldRemove(audiofile)),
  );
  queryClient.setQueryData<InfiniteData<HistoryPage>>(
    LISTENING_HISTORY_KEY,
    (data) => removeInfiniteItems(data, shouldRemove),
  );
}

export function removePlaylistFromCache(
  queryClient: QueryClient,
  playlistId: Playlist["id"],
) {
  queryClient.setQueryData<InfiniteData<PlaylistPage>>(
    PLAYLISTS_LIST_KEY,
    (data) =>
      removeInfiniteItems<Playlist, PlaylistPage, unknown>(
        data,
        (playlist) => playlist.id === playlistId,
      ),
  );
  removeAudiofilesFromDerivedCaches(
    queryClient,
    (audiofile) => audiofile.playlist_id === playlistId,
  );
  queryClient.removeQueries({ queryKey: getPlaylistKey(playlistId) });
}

export function removeAudiofileFromCache(
  queryClient: QueryClient,
  audiofile: Audiofile,
) {
  queryClient.setQueryData<InfiniteData<AudiofilePage>>(
    getPlaylistAudiofilesKey(audiofile.playlist_id),
    (data) =>
      removeInfiniteItems<Audiofile, AudiofilePage, unknown>(
        data,
        (item) => item.id === audiofile.id,
      ),
  );
  removeAudiofilesFromDerivedCaches(
    queryClient,
    (item) => item.id === audiofile.id,
  );
}

export function removePlaylistInviteFromCache(
  queryClient: QueryClient,
  invite: PlaylistInvite,
) {
  queryClient.setQueryData<InfiniteData<PlaylistInvitePage>>(
    PLAYLIST_INVITES_KEY,
    (data) =>
      removeInfiniteItems<PlaylistInvite, PlaylistInvitePage, unknown>(
        data,
        (item) => item.id === invite.id,
      ),
  );
}

function addListeningHistoryToCache(
  queryClient: QueryClient,
  item: HistoryMutationItem,
) {
  queryClient.setQueryData<InfiniteData<HistoryPage>>(
    LISTENING_HISTORY_KEY,
    (data) =>
      prependInfiniteItem<HistoryItem, HistoryPage, unknown>(
        data,
        item,
        (existing) => existing.id === item.id,
      ),
  );
}

export async function recordListeningHistory(
  queryClient: QueryClient,
  audiofileId: Audiofile["id"],
  signal?: AbortSignal,
) {
  const item = await addListeningHistory({
    path: { audiofile_id: audiofileId },
    signal,
  });
  signal?.throwIfAborted();
  addListeningHistoryToCache(queryClient, item);
  await queryClient.invalidateQueries({ queryKey: MOST_PLAYED_KEY });
}
