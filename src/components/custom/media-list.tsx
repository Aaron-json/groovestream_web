import MediaCard, { MediaCardSkeleton } from "./media-card";
import { Audiofile, Playlist } from "@/types/media";

export type MediaCardListProps = {
  title?: string;
  media: (Audiofile | Playlist)[];
  loading?: boolean;
  mediaStoreKey?: string;
};

export default function MediaList({
  title,
  media,
  loading,
  mediaStoreKey,
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
            mediaStoreKey={mediaStoreKey}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function MediaListSkeleton() {
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
