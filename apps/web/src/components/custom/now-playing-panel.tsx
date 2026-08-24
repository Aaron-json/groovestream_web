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
import { Disc, ListMusic, Mic2, Tag, User, Volume2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { shallow } from "zustand/shallow";

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

const informationPanelClassName =
  "rounded-lg border border-border/60 bg-background/60 p-3";

function CurrentTrackInformation({
  audiofile,
  playbackItem,
}: {
  audiofile: Audiofile;
  playbackItem: PlaybackItem | undefined;
}) {
  const title = audiofile.title || audiofile.filename;
  return (
    <div className="shrink-0 border-b px-4 py-3">
      <h3
        className="mb-3 truncate text-base font-semibold text-foreground"
        title={title}
      >
        {title}
      </h3>

      <Tabs defaultValue="track">
        <TabsList className="w-full">
          <TabsTrigger value="track">Track</TabsTrigger>
          <TabsTrigger value="playback">Playback</TabsTrigger>
        </TabsList>
        <TabsContent value="track" className={informationPanelClassName}>
          <div className="space-y-2 text-xs text-muted-foreground">
            <TrackDetail icon={<Mic2 />}>
              Artist{" "}
              <span className="font-medium text-foreground">
                {audiofile.artists?.join(", ") || "Unknown artist"}
              </span>
            </TrackDetail>
            <TrackDetail icon={<ListMusic />}>
              Playlist <PlaylistLink playlistId={audiofile.playlist_id} />
            </TrackDetail>
            {audiofile.uploaded_by_username && (
              <TrackDetail icon={<User />}>
                Uploaded by{" "}
                <span className="font-medium text-foreground">
                  {audiofile.uploaded_by_username}
                </span>
              </TrackDetail>
            )}
            {audiofile.album && (
              <TrackDetail icon={<Disc />}>
                Album{" "}
                <span className="font-medium text-foreground">
                  {audiofile.album}
                </span>
              </TrackDetail>
            )}
            {audiofile.genre && (
              <TrackDetail icon={<Tag />}>
                Genre{" "}
                <span className="font-medium text-foreground">
                  {audiofile.genre}
                </span>
              </TrackDetail>
            )}
          </div>
        </TabsContent>
        <TabsContent value="playback" className={informationPanelClassName}>
          {playbackItem ? (
            <PlaybackDetails item={playbackItem} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Encoding details will appear when playback starts.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaybackDetails({ item }: { item: PlaybackItem }) {
  const { encoding, delivery } = item;
  const bitrate = `${Math.round(encoding.bitrate / 1_000)} kbps`;
  const sampleRateKhz = encoding.sample_rate / 1_000;
  const sampleRateValue = Number.isInteger(sampleRateKhz)
    ? sampleRateKhz.toFixed(0)
    : sampleRateKhz.toFixed(1);
  const sampleRate = `${sampleRateValue} kHz`;
  let channels = `${encoding.channels} channels`;
  if (encoding.channels === 1) channels = "Mono";
  if (encoding.channels === 2) channels = "Stereo";
  const properties = [
    ["Codec", encoding.codec.toUpperCase()],
    ["Bitrate", bitrate],
    ["Sample rate", sampleRate],
    ["Channels", channels],
    ["Container", encoding.container.toUpperCase()],
    ["Delivery", delivery.toUpperCase()],
  ] as const;

  return (
    <div className="text-xs">
      <dl className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        {properties.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 truncate font-medium text-foreground tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-2.5 border-t border-border/50 pt-2.5">
        <span className="text-muted-foreground">Encoding ID</span>
        <code
          className="mt-0.5 block truncate text-[0.6875rem] text-foreground"
          title={encoding.id}
        >
          {encoding.id}
        </code>
      </div>
    </div>
  );
}

function TrackDetail({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground/60">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}

function PlaylistLink({ playlistId }: { playlistId: string }) {
  const { data: playlist } = useQuery(playlistInfoOptions(playlistId));

  return (
    <Link
      to="/library/playlists/$playlistId"
      params={{ playlistId }}
      className="font-medium text-foreground hover:underline"
    >
      {playlist?.name || "Playlist"}
    </Link>
  );
}

function Queue({ media }: { media: AudioSourcePosition }) {
  const playbackStatus = usePlaybackStore((state) => state.playerState.status);
  const setMedia = usePlaybackStore((state) => state.setMedia);
  const source = media.source;
  const getQueueSnapshot = useMemo(() => {
    // useSyncExternalStore requires the same object until an observed value
    // changes; AudioSource already provides that guarantee for its item list.
    let snapshot = {
      audiofiles: source.getAudiofiles(),
      hasMore: source.pagination?.hasMore() ?? false,
      loadingMore: source.pagination?.isLoading() ?? false,
    };

    return () => {
      const nextSnapshot = {
        audiofiles: source.getAudiofiles(),
        hasMore: source.pagination?.hasMore() ?? false,
        loadingMore: source.pagination?.isLoading() ?? false,
      };
      if (!shallow(snapshot, nextSnapshot)) snapshot = nextSnapshot;
      return snapshot;
    };
  }, [source]);
  const queueSnapshot = useSyncExternalStore(
    source.subscribe,
    getQueueSnapshot,
    getQueueSnapshot,
  );
  const queueItems = queueSnapshot.audiofiles;
  const pagination = source.pagination;
  const [paginationErrorSource, setPaginationErrorSource] =
    useState<AudioSource>();

  function loadMore() {
    if (!pagination || !pagination.hasMore() || pagination.isLoading()) return;

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
            hasMore: queueSnapshot.hasMore,
            isLoading: queueSnapshot.loadingMore,
            isError: paginationErrorSource === source,
          }}
        />
      </div>
    </>
  );
}
