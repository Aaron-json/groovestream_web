import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createPlaylistAudiofileSource,
  flattenInfiniteData,
  playlistAudiofilesOptions,
} from "@/query/media";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  AudiofileTable,
  AudiofileTableSkeleton,
} from "@/components/custom/audiofile-table";
import { Music2 } from "lucide-react";
import InfoCard from "@/components/custom/info-card";
import { queryClient } from "@/lib/query";
import { useMemo } from "react";
import { InfiniteScrollTrigger } from "@/components/custom/infinite-list";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/",
)({
  component: RouteComponent,
  loader: ({ params }) => {
    return queryClient.prefetchInfiniteQuery(
      playlistAudiofilesOptions(params.playlistId),
    );
  },
  pendingMs: 200,
  pendingComponent: PlaylistTracksPending,
  errorComponent: () => (
    <InfoCard
      variant="destructive"
      title="Error"
      text="Unable to load tracks. Please try refreshing the page."
    />
  ),
});

function RouteComponent() {
  const { playlistId } = Route.useParams();
  const {
    data: audiofilesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useSuspenseInfiniteQuery(playlistAudiofilesOptions(playlistId));
  const audiofileSource = useMemo(
    () => createPlaylistAudiofileSource(playlistId),
    [playlistId],
  );

  const audiofilesList = flattenInfiniteData(
    audiofilesData,
    (page) => page.data ?? [],
  );
  const pagination = {
    loadMore: fetchNextPage,
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
    isError: isFetchNextPageError,
  };

  if (audiofilesList.length === 0 && !hasNextPage) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Music2 />
          </EmptyMedia>
          <EmptyTitle>No tracks yet</EmptyTitle>
          <EmptyDescription>
            Upload audio to start listening to this playlist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            render={
              <Link
                to="/library/playlists/$playlistId/upload"
                params={{ playlistId }}
              />
            }
          >
            Upload audio
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex max-h-full flex-col rounded-md border">
      <AudiofileTable
        audiofiles={audiofilesList}
        audiofileSource={audiofileSource}
        scrollEnd={<InfiniteScrollTrigger pagination={pagination} />}
      />
    </div>
  );
}

function PlaylistTracksPending() {
  return (
    <div className="flex max-h-full flex-col rounded-md border">
      <AudiofileTableSkeleton />
    </div>
  );
}
