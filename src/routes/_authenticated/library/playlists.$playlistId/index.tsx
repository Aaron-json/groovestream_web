import { createFileRoute } from "@tanstack/react-router";
import { usePlaylistAudiofiles } from "@/hooks/media";
import InfoCard from "@/components/custom/info-card";
import AudiofileTable from "@/components/custom/audiofile-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Audiofile } from "@/api/types/media";
import { queryClient } from "@/routes/_authenticated";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { playlistId } = Route.useParams();

  const {
    data: audiofiles,
    isLoading: audiofilesLoading,
    error: audiofilesError,
    refetch: refetchAudiofiles,
    storeKey,
    queryKey,
  } = usePlaylistAudiofiles(playlistId);

  function renderAudiofiles(currentAudiofiles: Audiofile[]) {
    if (currentAudiofiles.length === 0) {
      return <InfoCard text="No tracks in this playlist yet" />;
    }
    return (
      <AudiofileTable
        audiofiles={currentAudiofiles}
        storeKey={storeKey}
        queryKey={queryKey}
        onChange={() => {
          queryClient.invalidateQueries();
        }}
        refetch={refetchAudiofiles}
      />
    );
  }

  if (audiofilesLoading) {
    return (
      <section className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg"
          >
            <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
            <div className="flex-grow space-y-1.5">
              <Skeleton className="h-4 w-4/5 rounded-md" />{" "}
              <Skeleton className="h-3 w-3/5 rounded-md" />{" "}
            </div>
            <Skeleton className="h-6 w-14 rounded-md flex-shrink-0" />
          </div>
        ))}
      </section>
    );
  }

  if (audiofilesError) {
    return <InfoCard text={"Something went wrong. Please try refreshing."} />;
  }

  if (!audiofiles) {
    return <InfoCard text="Could not load tracks for the playlist." />;
  }

  return <section>{renderAudiofiles(audiofiles)}</section>;
}
