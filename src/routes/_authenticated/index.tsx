import { createFileRoute } from "@tanstack/react-router";
import { useMostPlayed, useListeningHistory } from "@/hooks/media";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import { getUser } from "@/api/requests/user";
import { useQuery } from "@tanstack/react-query";
import { Music2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/_authenticated/")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    data: user,
    isLoading: userLoading,
    error: userErr,
  } = useQuery({ queryKey: ["user"], queryFn: getUser });

  const {
    data: mostPlayed,
    isLoading: mostPlayedLoading,
    error: mostPlayedErr,
    storeKey: mostPlayedStoreKey,
    queryKey: mostPlayedQueryKey,
  } = useMostPlayed(10);

  const {
    data: history,
    isLoading: historyLoading,
    error: historyErr,
    storeKey: historyStoreKey,
    queryKey: historyQueryKey,
  } = useListeningHistory(6);

  function getDisplay() {
    if (historyLoading || mostPlayedLoading || userLoading) {
      return <MediaListSkeleton />;
    } else if (
      mostPlayedErr ||
      historyErr ||
      userErr ||
      !mostPlayed ||
      !history ||
      !user
    ) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load your content. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    } else if (mostPlayed.length === 0 && history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Music2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            Welcome, {user.username}!
          </h3>
          <p className="text-muted-foreground max-w-md">
            Start exploring and listening to music. Your most played tracks and
            listening history will appear here.
          </p>
        </div>
      );
    } else {
      return (
        <>
          {mostPlayed.length > 0 && (
            <MediaList
              title="Most Played"
              media={mostPlayed}
              storeKey={mostPlayedStoreKey}
              queryKey={mostPlayedQueryKey}
            />
          )}

          {history.length > 0 && (
            <MediaList
              title="Listening History"
              media={history}
              storeKey={historyStoreKey}
              queryKey={historyQueryKey}
            />
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
