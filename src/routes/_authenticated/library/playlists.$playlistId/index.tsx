import { createFileRoute } from "@tanstack/react-router";
import { usePlaylistAudiofiles } from "@/hooks/media";
import InfoCard from "@/components/custom/info-card";
import AudiofileTable from "@/components/custom/audiofile-table";
import { queryClient } from "@/lib/query";

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
    return <InfoCard text="Unable to load tracks. Please try refreshing." />;
  }

  if (!audiofiles || audiofiles.length === 0) {
    return <InfoCard text="No tracks in this playlist yet" />;
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
