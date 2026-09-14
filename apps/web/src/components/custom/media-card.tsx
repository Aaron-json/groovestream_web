import type { ReactNode } from "react";
import {
  ChevronRight,
  Clock3,
  ListMusic,
  LoaderCircle,
  Pause,
  Play,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

import type {
  Audiofile,
  HistoryItem,
  Playlist,
} from "@groovestream/api/models";
import { formatDuration } from "@groovestream/media/duration";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import {
  getAudioSourcePosition,
  isSameAudioSource,
  type AudioSource,
} from "@groovestream/media/source";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});
const datedYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const elapsedMilliseconds = now.getTime() - date.getTime();

  if (Number.isNaN(elapsedMilliseconds)) return "recently";
  if (elapsedMilliseconds < 60_000) return "just now";

  const minutes = Math.floor(elapsedMilliseconds / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const formatter =
    date.getFullYear() === now.getFullYear()
      ? shortDateFormatter
      : datedYearFormatter;
  return formatter.format(date);
}

type MediaRowProps = {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  prefix?: ReactNode;
  detail?: string;
  metadata?: ReactNode;
  action?: ReactNode;
  active?: boolean;
};

function MediaRow({
  icon,
  title,
  subtitle,
  prefix,
  detail,
  metadata,
  action,
  active = false,
}: MediaRowProps) {
  return (
    <div
      className={cn(
        "flex h-full items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
        "group-hover/media-card:bg-muted/50",
        active && "bg-muted",
      )}
    >
      {prefix}

      {icon && (
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <h3
          className="truncate text-sm font-medium leading-snug text-foreground"
          title={title}
        >
          {title}
        </h3>

        <p
          className="truncate text-xs leading-normal text-muted-foreground"
          title={subtitle}
        >
          {subtitle}
        </p>

        {metadata}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 pl-1">
        {detail && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {detail}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}

type AudiofileCardProps = {
  audiofile: Audiofile;
  source: AudioSource;
  index: number;
  prefix?: ReactNode;
  metadata?: ReactNode;
};

function AudiofileCard({
  audiofile,
  source,
  index,
  prefix,
  metadata,
}: AudiofileCardProps) {
  const { currentMedia, setMedia, playPauseToggle, playbackState } =
    usePlaybackStore(
      useShallow((state) => ({
        currentMedia: state.playerState.currentMedia,
        setMedia: state.setMedia,
        playPauseToggle: state.playPauseToggle,
        playbackState: state.playerState.status,
      })),
    );

  const sourcePosition = getAudioSourcePosition(source, index);
  const isCurrentSourceItem =
    sourcePosition !== undefined &&
    currentMedia !== undefined &&
    isSameAudioSource(currentMedia.source, source) &&
    currentMedia.item.id === sourcePosition.item.id;
  const isPlaying = isCurrentSourceItem && playbackState === "playing";
  const isLoading = isCurrentSourceItem && playbackState === "loading";

  async function handlePlayback() {
    try {
      const position = getAudioSourcePosition(source, index);
      if (!position || position.item.audiofile.id !== audiofile.id) {
        toast.error("This track is no longer available in the playback queue");
        return;
      }

      if (
        currentMedia &&
        isSameAudioSource(currentMedia.source, source) &&
        currentMedia.item.id === position.item.id
      ) {
        await playPauseToggle();
        return;
      }

      await setMedia(position);
    } catch (error) {
      toast.error("Playback Error", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const title = audiofile.title || audiofile.filename;
  const artists = audiofile.artists?.join(", ") || "Unknown Artist";
  const subtitle = audiofile.album
    ? `${artists} · ${audiofile.album}`
    : artists;

  const duration =
    audiofile.duration === null
      ? undefined
      : formatDuration(audiofile.duration / 1000);
  const PlaybackIcon = isLoading ? LoaderCircle : isPlaying ? Pause : Play;
  const playbackLabel = isLoading
    ? `Loading ${title}`
    : `${isPlaying ? "Pause" : "Play"} ${title}`;

  return (
    <button
      type="button"
      className="group/media-card block w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
      onClick={() => void handlePlayback()}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={playbackLabel}
      aria-current={isCurrentSourceItem ? "true" : undefined}
    >
      <MediaRow
        title={title}
        subtitle={subtitle}
        prefix={prefix}
        detail={duration}
        metadata={metadata}
        active={isCurrentSourceItem}
        action={
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center text-muted-foreground transition-colors",
              isCurrentSourceItem
                ? "text-foreground"
                : "group-hover/media-card:text-foreground",
            )}
            aria-hidden="true"
          >
            <PlaybackIcon
              className={cn(
                "size-3.5",
                isLoading && "animate-spin",
                !isLoading && !isPlaying && "translate-x-px",
              )}
            />
          </span>
        }
      />
    </button>
  );
}

type SourceCardProps = {
  source: AudioSource;
  index: number;
};

export function MostPlayedCard({
  audiofile,
  source,
  index,
}: SourceCardProps & { audiofile: Audiofile }) {
  const rank = index + 1;

  return (
    <AudiofileCard
      audiofile={audiofile}
      source={source}
      index={index}
      prefix={
        <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
          {String(rank).padStart(2, "0")}
        </span>
      }
    />
  );
}

export function ListeningHistoryCard({
  item,
  source,
  index,
}: SourceCardProps & { item: HistoryItem }) {
  const relativeTime = formatRelativeTime(item.last_played);

  return (
    <AudiofileCard
      audiofile={item}
      source={source}
      index={index}
      metadata={
        <time
          dateTime={item.last_played}
          className="flex items-center gap-1 pt-0.5 text-[0.6875rem] text-muted-foreground"
        >
          <Clock3 className="size-3 shrink-0" aria-hidden="true" />
          <span>Played {relativeTime}</span>
        </time>
      }
    />
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to="/library/playlists/$playlistId"
      params={{ playlistId: playlist.id }}
      className="group/media-card block w-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      preload="intent"
    >
      <MediaRow
        icon={<ListMusic className="size-5" />}
        title={playlist.name}
        subtitle={`By ${playlist.owner_username}`}
        metadata={
          <time
            dateTime={playlist.created_at}
            className="text-[0.6875rem] text-muted-foreground"
          >
            Created {formatRelativeTime(playlist.created_at)}
          </time>
        }
        action={
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        }
      />
    </Link>
  );
}

export function MediaRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
      <Skeleton className="size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="size-4" />
      </div>
    </div>
  );
}
