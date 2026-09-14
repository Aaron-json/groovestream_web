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
  listPlaylistMembers,
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
  AudioSourceItem,
  AudioSourceSnapshot,
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
const PLAYLIST_MEMBERS_PAGE_SIZE = 50;
const INITIAL_CURSOR: string | undefined = undefined;
const EMPTY_AUDIO_SOURCE_ITEMS: readonly AudioSourceItem[] = [];

function getPlaylistKey(playlistId: Playlist["id"]) {
  return ["playlist", playlistId] as const;
}

function getPlaylistAudiofilesKey(playlistId: Playlist["id"]) {
  return [...getPlaylistKey(playlistId), "audiofiles"] as const;
}

export function getPlaylistMembersKey(playlistId: Playlist["id"]) {
  return [...getPlaylistKey(playlistId), "members"] as const;
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

export function playlistMembersOptions(playlistId: Playlist["id"]) {
  return infiniteQueryOptions({
    queryKey: getPlaylistMembersKey(playlistId),
    queryFn: ({ pageParam, signal }) =>
      listPlaylistMembers({
        path: { playlist_id: playlistId },
        query: { limit: PLAYLIST_MEMBERS_PAGE_SIZE, cursor: pageParam },
        signal,
      }),
    initialPageParam: INITIAL_CURSOR,
    getNextPageParam: getNextCursor,
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

type AudioSourceQueryResult = Readonly<{
  data: readonly AudioSourceItem[] | undefined;
}>;

type PaginatedAudioSourceQueryResult = AudioSourceQueryResult &
  Readonly<{
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
  }>;

type QueryAudioSourceConfig =
  | Readonly<{
      readResult(): AudioSourceQueryResult;
      subscribe: AudioSource["subscribe"];
      fetchNextPage?: undefined;
    }>
  | Readonly<{
      readResult(): PaginatedAudioSourceQueryResult;
      subscribe: AudioSource["subscribe"];
      fetchNextPage(): Promise<
        Readonly<{
          isFetchNextPageError: boolean;
          error: unknown;
        }>
      >;
    }>;

/** Adapts one query observer into the complete state exposed by AudioSource. */
function createQueryAudioSource(config: QueryAudioSourceConfig): AudioSource {
  let snapshot: AudioSourceSnapshot | undefined;

  const source: AudioSource = {
    getSnapshot: () => {
      if (!config.fetchNextPage) {
        const items = config.readResult().data ?? EMPTY_AUDIO_SOURCE_ITEMS;
        if (snapshot?.items === items) return snapshot;

        snapshot = { items, pagination: undefined };
        return snapshot;
      }

      const result = config.readResult();
      const items = result.data ?? EMPTY_AUDIO_SOURCE_ITEMS;
      const hasMore = result.hasNextPage;
      const isLoading = result.isFetchingNextPage;
      if (
        snapshot?.items === items &&
        snapshot.pagination?.hasMore === hasMore &&
        snapshot.pagination?.isLoading === isLoading
      ) {
        return snapshot;
      }

      snapshot = {
        items,
        pagination: { hasMore, isLoading },
      };
      return snapshot;
    },
    subscribe: config.subscribe,
  };

  if (config.fetchNextPage) {
    source.pagination = {
      loadMore: async () => {
        if (!config.readResult().hasNextPage) return;
        const result = await config.fetchNextPage();
        if (result.isFetchNextPageError) throw result.error;
      },
    };
  }
  return source;
}

function toAudioSourceItem(audiofile: Audiofile): AudioSourceItem {
  // Current API collections contain each audiofile once. When they expose an
  // occurrence ID, it can replace this ID without changing AudioSource.
  return { id: audiofile.id, audiofile };
}

function flattenAudiofilePagesToSourceItems<
  TPage extends { data: Audiofile[] | null },
  TPageParam,
>(data: InfiniteData<TPage, TPageParam>): AudioSourceItem[] {
  return flattenInfiniteData(data, (page) => page.data ?? []).map(
    toAudioSourceItem,
  );
}

export function createPlaylistAudiofileSource(
  queryClient: QueryClient,
  playlistId: Playlist["id"],
): AudioSource {
  const options = playlistAudiofilesOptions(playlistId);
  const observer = new InfiniteQueryObserver(queryClient, {
    ...options,
    enabled: false,
    select: flattenAudiofilePagesToSourceItems,
  });
  // The constructor stores defaulted options, but the public property retains
  // the broader input type in TanStack Query's declarations.
  const observerOptions = observer.options as Parameters<
    typeof observer.getOptimisticResult
  >[0];
  return createQueryAudioSource({
    // Optimistic reads include cache writes made before the first subscriber.
    readResult: () => observer.getOptimisticResult(observerOptions),
    subscribe: (listener) => observer.subscribe(listener),
    fetchNextPage: () => observer.fetchNextPage({ cancelRefetch: false }),
  });
}

export function createMostPlayedAudiofileSource(
  queryClient: QueryClient,
): AudioSource {
  const observerOptions = queryClient.defaultQueryOptions({
    ...mostPlayedOptions(),
    enabled: false,
    select: (audiofiles) =>
      audiofiles?.map(toAudioSourceItem) ?? EMPTY_AUDIO_SOURCE_ITEMS,
  });
  const observer = new QueryObserver(queryClient, observerOptions);
  return createQueryAudioSource({
    readResult: () => observer.getOptimisticResult(observerOptions),
    subscribe: (listener) => observer.subscribe(listener),
  });
}

export function createListeningHistoryAudiofileSource(
  queryClient: QueryClient,
): AudioSource {
  const options = listeningHistoryOptions();
  const observer = new InfiniteQueryObserver(queryClient, {
    ...options,
    enabled: false,
    select: flattenAudiofilePagesToSourceItems,
  });
  const observerOptions = observer.options as Parameters<
    typeof observer.getOptimisticResult
  >[0];
  return createQueryAudioSource({
    readResult: () => observer.getOptimisticResult(observerOptions),
    subscribe: (listener) => observer.subscribe(listener),
    fetchNextPage: () => observer.fetchNextPage({ cancelRefetch: false }),
  });
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
