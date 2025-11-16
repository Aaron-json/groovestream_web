import { createFileRoute, Link } from "@tanstack/react-router";
import { usePlaylistAudiofiles } from "@/hooks/media";
import AudiofileTable from "@/components/custom/audiofile-table";
import { queryClient } from "@/lib/query";
import { Music2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { playlistId } = Route.useParams();
  const {
    data: audiofiles,
    isLoading,
    error,
    refetch,
    storeKey,
    queryKey,
  } = usePlaylistAudiofiles(playlistId);

  if (isLoading) {
    return (
      <AudiofileTable
        skeleton
        audiofiles={[]}
        storeKey=""
        queryKey={queryKey}
      />
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to load tracks. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!audiofiles || audiofiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
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

  return (
    <AudiofileTable
      audiofiles={audiofiles}
      storeKey={storeKey}
      queryKey={queryKey}
      onChange={() => queryClient.invalidateQueries()}
      refetch={refetch}
    />
  );
}
