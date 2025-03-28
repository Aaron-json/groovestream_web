import { createFileRoute } from "@tanstack/react-router";
import { useMostPlayed, useListeningHistory } from "@/hooks/media";
import MediaList from "@/components/custom/media-list";
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
    key: mostPlayedKey,
  } = useMostPlayed(10);

  const {
    data: history,
    isLoading: historyLoading,
    error: historyErr,
    key: historyKey,
  } = useListeningHistory(6);

  // loading states
  if (historyLoading || mostPlayedLoading || userLoading) {
    return <MediaList loading={true} media={[]} />;
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
            mediaStoreKey={mostPlayedKey}
          />
        )}
        {history.length > 0 && (
          <MediaList
            title="Listening History"
            media={history}
            mediaStoreKey={historyKey}
          />
        )}
      </section>
    );
  }
}
