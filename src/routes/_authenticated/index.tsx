import { createFileRoute } from "@tanstack/react-router";
import { useMostPlayed, useListeningHistory } from "@/hooks/media";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import InfoCard from "@/components/custom/info-card";
import { getUser } from "@/api/requests/user";
import { useQuery } from "@tanstack/react-query";

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

  // loading states
  if (historyLoading || mostPlayedLoading || userLoading) {
    return <MediaListSkeleton />;
  } else if (
    // error states
    mostPlayedErr ||
    historyErr ||
    userErr ||
    !mostPlayed ||
    !history ||
    !user
  ) {
    return <InfoCard text="Error encountered" />;
  } else if (mostPlayed.length === 0 && history.length === 0) {
    return (
      <InfoCard
        text={`Hey ${user.username}! Seems like you haven't listened to anything yet. 😕`}
      />
    );
  } else {
    return (
      <section>
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
      </section>
    );
  }
}
