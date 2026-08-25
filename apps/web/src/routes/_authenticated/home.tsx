import { createFileRoute } from "@tanstack/react-router";
import {
  createListeningHistoryAudiofileSource,
  createMostPlayedAudiofileSource,
} from "@/query/media";
import {
  flattenInfiniteData,
  listeningHistoryOptions,
  mostPlayedOptions,
} from "@groovestream/query/media";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import { Music2 } from "lucide-react";
import InfoCard from "@/components/custom/info-card";
import { InfiniteList } from "@/components/custom/infinite-list";
import { useRouteContext } from "@tanstack/react-router";

import { queryClient } from "@/lib/query";
import { useMemo } from "react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const Route = createFileRoute("/_authenticated/home")({
  component: RouteComponent,
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(mostPlayedOptions()),
      queryClient.prefetchInfiniteQuery(listeningHistoryOptions()),
    ]);
  },
  pendingMs: 200,
  pendingComponent: () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
      </div>
      <MediaListSkeleton />
    </section>
  ),
  errorComponent: () => (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
      </div>
      <InfoCard
        variant="destructive"
        title="Error"
        text="Unable to load your content. Please try refreshing the page."
      />
    </section>
  ),
  staticData: {
    crumbs: () => [{ label: "Home", to: "/home" }],
  },
});

function RouteComponent() {
  const { user } = useRouteContext({ from: "__root__" });
  const { data: mostPlayed } = useSuspenseQuery(mostPlayedOptions());
  const mostPlayedSource = useMemo(() => createMostPlayedAudiofileSource(), []);

  const {
    data: historyData,
    fetchNextPage: fetchHistory,
    hasNextPage: hasNextHistory,
    isFetchingNextPage: isFetchingHistory,
    isFetchNextPageError: isHistoryNextPageError,
  } = useSuspenseInfiniteQuery(listeningHistoryOptions());
  const historySource = useMemo(
    () => createListeningHistoryAudiofileSource(),
    [],
  );

  const mostPlayedList = mostPlayed ?? [];
  const historyList = flattenInfiniteData(
    historyData,
    (page) => page.data ?? [],
  );
  const historyPagination = {
    loadMore: fetchHistory,
    hasMore: hasNextHistory ?? false,
    isLoading: isFetchingHistory,
    isError: isHistoryNextPageError,
  };

  function getDisplay() {
    if (
      mostPlayedList.length === 0 &&
      historyList.length === 0 &&
      !hasNextHistory
    ) {
      const username_text = user?.username
        ? `Welcome, ${user.username}!`
        : "Welcome!";
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Music2 />
            </EmptyMedia>
            <EmptyTitle>{username_text}</EmptyTitle>
            <EmptyDescription>
              Start exploring and listening to music. Your most played tracks
              and listening history will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    } else {
      return (
        <>
          {mostPlayedList.length > 0 && (
            <MediaList
              title="Most Played"
              media={mostPlayedList}
              audiofileSource={mostPlayedSource}
            />
          )}

          {(historyList.length > 0 || hasNextHistory) && (
            <InfiniteList
              pagination={historyPagination}
              loadingFallback={<MediaListSkeleton />}
            >
              <MediaList
                title="Listening History"
                media={historyList}
                audiofileSource={historySource}
              />
            </InfiniteList>
          )}
        </>
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Home</h1>
      </div>
      {getDisplay()}
    </section>
  );
}
