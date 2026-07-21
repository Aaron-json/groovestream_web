import type { AudiofileSource } from "@/lib/media/types";
import MediaCard, { MediaCardSkeleton } from "./media-card";
import { Audiofile, Playlist } from "@/api/requests/media";

export type MediaCardListProps = {
  audiofileSource?: AudiofileSource;
  title?: string;
  media: (Audiofile | Playlist)[];
};

export default function MediaList({
  title,
  media,
  audiofileSource,
}: MediaCardListProps) {
  return (
    <div className="flex flex-col w-full p-1 gap-1">
      {title && (
        <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      )}
      <div className="flex flex-wrap gap-4 px-2">
        {media.map((audiofile, index) => (
          <MediaCard
            key={audiofile.id}
            media={audiofile}
            audiofileSource={audiofileSource}
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
