import type { Audiofile } from "@groovestream/api/models";
import { Button } from "@/components/ui/button";
import { InfiniteScrollTrigger } from "@/components/custom/infinite-list";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { playlistInfoOptions } from "@groovestream/query/media";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PlaybackItem } from "@groovestream/media/encodings";
import type {
  AudioSource,
  AudioSourcePosition,
} from "@groovestream/media/source";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { formatDuration } from "@groovestream/media/duration";
import { useUIStore } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Volume2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

export function NowPlayingPanel() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileNowPlayingSheet /> : <DesktopNowPlayingPanel />;
}

function DesktopNowPlayingPanel() {
  const open = useUIStore((state) => state.nowPlayingOpen);
  const setOpen = useUIStore((state) => state.setNowPlayingOpen);

  return (
    <aside
      aria-label="Now playing"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "flex flex-col shrink-0 overflow-hidden border-l bg-card transition-[width,border-color] duration-200 ease-linear",
        open ? "w-96" : "w-0 border-transparent",
      )}
    >
      <div className="flex flex-1 w-96 flex-col">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <h2 className="text-sm font-semibold">Now Playing</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label="Close now playing panel"
          >
            <X />
          </Button>
        </div>
        <NowPlayingContent />
      </div>
    </aside>
  );
}

function MobileNowPlayingSheet() {
  const open = useUIStore((state) => state.nowPlayingOpen);
  const setOpen = useUIStore((state) => state.setNowPlayingOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="h-12 flex-row items-center border-b px-4 py-0">
          <SheetTitle className="text-sm font-semibold">Now Playing</SheetTitle>
          <SheetDescription className="sr-only">
            The current track and playback queue
          </SheetDescription>
        </SheetHeader>
        <NowPlayingContent />
      </SheetContent>
    </Sheet>
  );
}

function NowPlayingContent() {
  const media = usePlaybackStore((state) => state.playerState.currentMedia);

  if (!media) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        Play a track to see it here.
      </p>
    );
  }

  return (
    <div className="h-full flex min-h-0 flex-1 flex-col">
      <CurrentTrackInformation
        audiofile={media.audiofile}
        playbackItem={media.playbackItem}
      />
      <Queue media={media} />
    </div>
  );
}

function CurrentTrackInformation({
  audiofile,
  playbackItem,
}: {
  audiofile: Audiofile;
  playbackItem: PlaybackItem | undefined;
}) {
  const title = audiofile.title || audiofile.filename;
  const artist = audiofile.artists?.join(", ") || "Unknown artist";

  return (
    <section className="shrink-0 border-b border-border/60 px-4 py-3.5 space-y-3">
      <div className="min-w-0">
        <h3
          className="truncate text-base font-semibold leading-snug text-foreground"
          title={title}
        >
          {title}
        </h3>
        <p
          className="mt-0.5 truncate text-xs font-medium text-muted-foreground"
          title={artist}
        >
          {artist}
        </p>
      </div>

      <Tabs defaultValue="track">
        <TabsList className="h-7 w-full rounded-md bg-muted/60 p-0.5">
          <TabsTrigger
            value="track"
            className="h-full rounded-sm text-xs text-muted-foreground data-active:shadow-xs"
          >
            Track Details
          </TabsTrigger>
          <TabsTrigger
            value="playback"
            className="h-full rounded-sm text-xs text-muted-foreground data-active:shadow-xs"
          >
            Audio Specs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="track" className="pt-1">
          <dl className="grid grid-cols-2 gap-1.5 text-xs">
            <MetaTile label="Playlist">
              <PlaylistLink playlistId={audiofile.playlist_id} />
            </MetaTile>
            {audiofile.album && (
              <MetaTile label="Album">{audiofile.album}</MetaTile>
            )}
            {audiofile.genre && (
              <MetaTile label="Genre">{audiofile.genre}</MetaTile>
            )}
            {audiofile.track_number != null && (
              <MetaTile label="Track">
                <span className="font-semibold tabular-nums">
                  #{audiofile.track_number}
                  {audiofile.track_total ? ` of ${audiofile.track_total}` : ""}
                </span>
              </MetaTile>
            )}
            {audiofile.uploaded_by_username && (
              <MetaTile label="Added by">
                {audiofile.uploaded_by_username}
              </MetaTile>
            )}
          </dl>
        </TabsContent>
        <TabsContent value="playback" className="pt-1">
          {playbackItem ? (
            <PlaybackDetails item={playbackItem} />
          ) : (
            <p className="py-2.5 text-center text-xs text-muted-foreground">
              Audio stream details will appear when playback begins.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function PlaybackDetails({ item }: { item: PlaybackItem }) {
  const { delivery, encoding } = item;
  const bitrate = `${Math.round(encoding.bitrate / 1_000)} kbps`;
  const sampleRateKhz = encoding.sample_rate / 1_000;
  const sampleRateValue = Number.isInteger(sampleRateKhz)
    ? sampleRateKhz.toFixed(0)
    : sampleRateKhz.toFixed(1);
  const sampleRate = `${sampleRateValue} kHz`;
  let channels = `${encoding.channels} ch`;
  if (encoding.channels === 1) channels = "Mono";
  if (encoding.channels === 2) channels = "Stereo";

  const properties = [
    { label: "Codec", value: encoding.codec.toUpperCase() },
    { label: "Bitrate", value: bitrate },
    { label: "Sample Rate", value: sampleRate },
    { label: "Channels", value: channels },
    { label: "Container", value: encoding.container.toUpperCase() },
    { label: "Delivery", value: delivery.toUpperCase() },
  ] as const;

  return (
    <dl className="grid grid-cols-2 gap-1.5 text-xs">
      {properties.map(({ label, value }) => (
        <MetaTile key={label} label={label}>
          <span className="font-semibold tabular-nums">{value}</span>
        </MetaTile>
      ))}
    </dl>
  );
}

function MetaTile({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2.5 py-1.5">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className="mt-0.5 truncate font-medium text-foreground"
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </dd>
    </div>
  );
}

function PlaylistLink({ playlistId }: { playlistId: string }) {
  const { data: playlist } = useQuery(playlistInfoOptions(playlistId));
  const name = playlist?.name || "Playlist";

  return (
    <Link
      to="/library/playlists/$playlistId"
      params={{ playlistId }}
      className="transition-colors hover:text-primary"
      title={name}
    >
      {name}
    </Link>
  );
}

function Queue({ media }: { media: AudioSourcePosition }) {
  const playbackStatus = usePlaybackStore((state) => state.playerState.status);
  const setMedia = usePlaybackStore((state) => state.setMedia);
  const source = media.source;
  const queueSnapshot = useSyncExternalStore(
    source.subscribe,
    source.getSnapshot,
    source.getSnapshot,
  );
  const queueItems = queueSnapshot.audiofiles;
  const pagination = source.pagination;
  const [paginationErrorSource, setPaginationErrorSource] =
    useState<AudioSource>();

  function loadMore() {
    const paginationState = source.getSnapshot().pagination;
    if (
      !pagination ||
      !paginationState?.hasMore ||
      paginationState.isLoading
    ) {
      return;
    }

    setPaginationErrorSource(undefined);
    void pagination.loadMore().catch(() => setPaginationErrorSource(source));
  }

  function playQueueItem(index: number) {
    const audiofile = queueItems[index];
    if (!audiofile) return;
    setMedia({ source, index, audiofile }).catch((error) => {
      toast.error("Playback Error", {
        description: error instanceof Error ? error.message : undefined,
      });
    });
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Queue
        </span>
        <span className="text-xs text-muted-foreground">
          {queueItems.length} tracks
        </span>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-border/40 overflow-y-auto">
        {queueItems.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            The queue is no longer available.
          </p>
        ) : (
          queueItems.map((item, index) => {
            const active = item.id === media.audiofile.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => playQueueItem(index)}
                className={cn(
                  "grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-2.5 text-left transition-colors",
                  active
                    ? "bg-accent/50 text-accent-foreground"
                    : "hover:bg-accent/30",
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums text-muted-foreground",
                    active && "text-foreground",
                  )}
                >
                  {active && playbackStatus === "playing" ? (
                    <Volume2 className="size-3.5 text-primary opacity-80" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {item.title || item.filename}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.artists?.join(", ") || "Unknown artist"}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDuration(
                    item.duration ? item.duration / 1000 : undefined,
                  )}
                </span>
              </button>
            );
          })
        )}
        <InfiniteScrollTrigger
          pagination={{
            loadMore,
            hasMore: queueSnapshot.pagination?.hasMore ?? false,
            isLoading: queueSnapshot.pagination?.isLoading ?? false,
            isError: paginationErrorSource === source,
          }}
        />
      </div>
    </>
  );
}
