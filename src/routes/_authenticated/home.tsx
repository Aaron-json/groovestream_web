import { createFileRoute } from "@tanstack/react-router";
import { mostPlayedOptions, listeningHistoryOptions } from "@/hooks/media";
import { useSuspenseQuery } from "@tanstack/react-query";
import MediaList, { MediaListSkeleton } from "@/components/custom/media-list";
import { Music2 } from "lucide-react";
import InfoCard from "@/components/custom/info-card";
import { userOptions } from "@/hooks/user";

import { queryClient } from "@/lib/query";

const MOST_PLAYED_COUNT = 10;
const LISTENING_HISTORY_COUNT = 6;

export const Route = createFileRoute("/_authenticated/home")({
  component: RouteComponent,
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(mostPlayedOptions(MOST_PLAYED_COUNT)),
      queryClient.ensureQueryData(
        listeningHistoryOptions(LISTENING_HISTORY_COUNT),
      ),
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
  const { data: user } = useSuspenseQuery(userOptions());
  const { data: mostPlayed } = useSuspenseQuery(
    mostPlayedOptions(MOST_PLAYED_COUNT),
  );
  const mostPlayedQueryKey = mostPlayedOptions().queryKey;

  const { data: history } = useSuspenseQuery(
    listeningHistoryOptions(LISTENING_HISTORY_COUNT),
  );
  const historyQueryKey = listeningHistoryOptions().queryKey;

  const mostPlayedList = mostPlayed ?? [];
  const historyList = history ?? [];

  function getDisplay() {
    if (mostPlayedList.length === 0 && historyList.length === 0) {
      const username_text = user?.username
        ? `Welcome, ${user.username}!`
        : "Welcome!";
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Music2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">{username_text}</h3>
          <p className="text-muted-foreground max-w-md">
            Start exploring and listening to music. Your most played tracks and
            listening history will appear here.
          </p>
        </div>
      );
    } else {
      return (
        <>
          {mostPlayedList.length > 0 && (
            <MediaList
              title="Most Played"
              media={mostPlayedList}
              queryKey={mostPlayedQueryKey}
            />
          )}

          {historyList.length > 0 && (
            <MediaList
              title="Listening History"
              media={historyList}
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
