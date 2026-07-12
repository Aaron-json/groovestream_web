import { createFileRoute, Link } from "@tanstack/react-router";
import { playlistAudiofilesOptions } from "@/hooks/media";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AudiofileTable } from "@/components/custom/audiofile-table";
import { Music2 } from "lucide-react";
import InfoCard from "@/components/custom/info-card";
import { queryClient } from "@/lib/query";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/",
)({
  component: RouteComponent,
  loader: ({ params }) => {
    return queryClient.ensureQueryData(
      playlistAudiofilesOptions(params.playlistId),
    );
  },
  pendingMs: 200,
  pendingComponent: () => {
    const { playlistId } = Route.useParams();
    return (
      <AudiofileTable
        skeleton
        audiofiles={[]}
        queryKey={playlistAudiofilesOptions(playlistId).queryKey}
      />
    );
  },
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
  const options = playlistAudiofilesOptions(playlistId);
  const { data: audiofiles } = useSuspenseQuery(options);
  const queryKey = options.queryKey;

  const audiofilesList = audiofiles ?? [];

  if (audiofilesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Music2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
        <Link
          to="/library/playlists/$playlistId/upload"
          params={{ playlistId }}
          className="text-muted-foreground hover:underline"
        >
          Click here to upload audio and get started
        </Link>{" "}
      </div>
    );
  }

  return <AudiofileTable audiofiles={audiofilesList} queryKey={queryKey} />;
}
