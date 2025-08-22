import { MediaQueryKey } from "@/hooks/media";
import MediaCard, { MediaCardSkeleton } from "./media-card";
import { Audiofile, Playlist } from "@/api/types/media";

export type MediaCardListProps = {
  storeKey?: string;
  queryKey?: MediaQueryKey;
  title?: string;
  media: (Audiofile | Playlist)[];
  loading?: boolean;
};

export default function MediaList({
  title,
  media,
  loading,
  storeKey,
  queryKey,
}: MediaCardListProps) {
  if (loading) {
    return <MediaListSkeleton />;
  }
  return (
    <div className="flex flex-col w-full p-2">
      {title && (
        <h2 className="text-lg font-semibold text-primary mb-2">{title}</h2>
      )}
      <div className="flex flex-wrap gap-4">
        {media.map((audiofile, index) => (
          <MediaCard
            key={audiofile.id}
            media={audiofile}
            storeKey={storeKey}
            queryKey={queryKey}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export function MediaListSkeleton() {
  return (
    <div className="flex w-full p-2">
      <div className="flex flex-wrap gap-4">
        <MediaCardSkeleton />
        <MediaCardSkeleton />
        <MediaCardSkeleton />
      </div>
    </div>
  );
}
