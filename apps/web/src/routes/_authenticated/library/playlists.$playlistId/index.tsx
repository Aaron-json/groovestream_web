import { createFileRoute, Link } from "@tanstack/react-router";
import { createPlaylistAudiofileSource } from "@/query/media";
import {
  flattenInfiniteData,
  playlistAudiofilesOptions,
  playlistInfoOptions,
} from "@groovestream/query/media";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  AudiofileTable,
  AudiofileTableSkeleton,
} from "@/components/custom/audiofile-table";
import { Music2 } from "lucide-react";
import InfoCard from "@/components/custom/info-card";
import { queryClient } from "@/lib/query";
import { useMemo } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfiniteList } from "@/components/custom/infinite-list";

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
  const { data: playlist } = useSuspenseQuery(playlistInfoOptions(playlistId));
  const canEdit =
    playlist.access_level === "WRITE" || playlist.access_level === "OWNER";
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
      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <Empty className="min-h-72">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Music2 />
              </EmptyMedia>
              <EmptyTitle>No tracks yet</EmptyTitle>
              <EmptyDescription>
                {canEdit
                  ? "Upload audio to start listening to this playlist."
                  : "The owner or an editor can add tracks to this playlist."}
              </EmptyDescription>
            </EmptyHeader>
            {canEdit && (
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
            )}
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <InfiniteList pagination={pagination}>
      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <AudiofileTable
            key={playlistId}
            audiofiles={audiofilesList}
            audiofileSource={audiofileSource}
            canSearch={!hasNextPage}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </InfiniteList>
  );
}

function PlaylistTracksPending() {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-0">
        <AudiofileTableSkeleton />
      </CardContent>
    </Card>
  );
}
