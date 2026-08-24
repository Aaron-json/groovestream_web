import {
  InfiniteQueryObserver,
  QueryObserver,
  infiniteQueryOptions,
  queryOptions,
  replaceEqualDeep,
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
  HistoryMutationItem,
  HistoryPage,
  Playlist,
  PlaylistInvite,
  PlaylistInvitePage,
  PlaylistPage,
} from "@groovestream/api/models";
import type {
  AudioSource,
  AudioSourcePagination,
} from "@groovestream/media/source";

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
const INITIAL_CURSOR: string | undefined = undefined;
const EMPTY_AUDIOFILES: readonly Audiofile[] = [];

function getPlaylistKey(playlistId: Playlist["id"]) {
  return ["playlist", playlistId] as const;
}

function getPlaylistAudiofilesKey(playlistId: Playlist["id"]) {
  return [...getPlaylistKey(playlistId), "audiofiles"] as const;
}

function getNextCursor(page: { has_more: boolean; cursor?: string }) {
  return page.has_more ? page.cursor : undefined;
}

export function flattenInfiniteData<TData, TParam, TItem>(
  data: InfiniteData<TData, TParam>,
  getItems: (page: TData) => readonly TItem[],
): TItem[] {
  return data.pages.flatMap(getItems);
}

function removeItems<TItem>(
  items: TItem[],
  shouldRemove: (item: TItem) => boolean,
) {
  if (!items.some(shouldRemove)) return items;
  return items.filter((item) => !shouldRemove(item));
}

type InfinitePage = { data: unknown[] | null };
type InfinitePageItem<TPage extends InfinitePage> = NonNullable<
  TPage["data"]
>[number];

function removeInfiniteItems<TPage extends InfinitePage, TPageParam>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  shouldRemove: (item: InfinitePageItem<TPage>) => boolean,
) {
  if (!data) return undefined;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.data) return page;
    const pageItems = removeItems(page.data, shouldRemove);
    if (pageItems === page.data) return page;
    changed = true;
    return { ...page, data: pageItems };
  });

  return changed ? { ...data, pages } : data;
}

function prependInfiniteItem<TPage extends InfinitePage, TPageParam>(
  data: InfiniteData<TPage, TPageParam> | undefined,
  item: InfinitePageItem<TPage>,
  isSameItem: (existing: InfinitePageItem<TPage>) => boolean,
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
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
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
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
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
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
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
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
  });
}

function createFlattenedInfiniteDataSnapshot<TPage, TItem>(
  readInfiniteData: () => InfiniteData<TPage> | undefined,
  getPageItems: (page: TPage) => readonly TItem[],
) {
  // Root identity avoids unnecessary flattening. Structural sharing also keeps
  // the AudioSource snapshot stable when only cursor metadata changes.
  let cachedData: InfiniteData<TPage> | undefined;
  let cachedItems: readonly TItem[] = [];

  return () => {
    const data = readInfiniteData();
    if (data === cachedData) return cachedItems;

    cachedData = data;
    cachedItems = replaceEqualDeep(
      cachedItems,
      data ? flattenInfiniteData(data, getPageItems) : [],
    );
    return cachedItems;
  };
}

function createAudioSourcePagination(
  observer: Pick<InfiniteQueryObserver, "getCurrentResult" | "fetchNextPage">,
): AudioSourcePagination {
  return {
    hasMore: () => observer.getCurrentResult().hasNextPage,
    isLoading: () => observer.getCurrentResult().isFetchingNextPage,
    loadMore: async () => {
      if (!observer.getCurrentResult().hasNextPage) return;
      const result = await observer.fetchNextPage({ cancelRefetch: false });
      if (result.isFetchNextPageError) throw result.error;
    },
  };
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
  const getAudiofiles = createFlattenedInfiniteDataSnapshot(
    () =>
      queryClient.getQueryData<InfiniteData<AudiofilePage>>(
        getPlaylistAudiofilesKey(playlistId),
      ),
    (page) => page.data ?? [],
  );
  return {
    getAudiofiles,
    subscribe: (listener) => observer.subscribe(listener),
    pagination: createAudioSourcePagination(observer),
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
      queryClient.getQueryData<Audiofile[] | null>(MOST_PLAYED_KEY) ??
      EMPTY_AUDIOFILES,
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
  const getAudiofiles = createFlattenedInfiniteDataSnapshot(
    () =>
      queryClient.getQueryData<InfiniteData<HistoryPage>>(
        LISTENING_HISTORY_KEY,
      ),
    (page) => page.data ?? [],
  );
  return {
    getAudiofiles,
    subscribe: (listener) => observer.subscribe(listener),
    pagination: createAudioSourcePagination(observer),
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
    data ? removeItems(data, shouldRemove) : data,
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
      removeInfiniteItems(data, (playlist) => playlist.id === playlistId),
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
    (data) => removeInfiniteItems(data, (item) => item.id === audiofile.id),
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
    (data) => removeInfiniteItems(data, (item) => item.id === invite.id),
  );
}

function addListeningHistoryToCache(
  queryClient: QueryClient,
  item: HistoryMutationItem,
) {
  queryClient.setQueryData<InfiniteData<HistoryPage>>(
    LISTENING_HISTORY_KEY,
    (data) =>
      prependInfiniteItem(data, item, (existing) => existing.id === item.id),
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
