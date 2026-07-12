import { Audiofile } from "@/api/requests/media";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePlaylistInfo } from "@/hooks/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { CurrentMedia } from "@/lib/media/types";
import { useMediaStateStore } from "@/lib/media/stores/state";
import { formatDuration } from "@/lib/media/utils";
import { useUIStore } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { skipToken, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Disc, ListMusic, Mic2, Tag, User, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

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
  const media = useMediaStateStore((state) => state.media);

  if (!media) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        Play a track to see it here.
      </p>
    );
  }

  return (
    <div className="h-full flex min-h-0 flex-1 flex-col">
      <CurrentTrackCard audiofile={media.audiofile} />
      <Queue media={media} />
    </div>
  );
}

function CurrentTrackCard({ audiofile }: { audiofile: Audiofile }) {
  const title = audiofile.title || audiofile.filename;
  return (
    <div className="shrink-0 border-b p-4">
      <div className="mb-4">
        <h3 className="truncate text-base font-semibold text-foreground" title={title}>
          {title}
        </h3>
      </div>

      <div className="space-y-2.5 rounded-lg bg-muted/50 border border-border/50 p-3 text-xs text-muted-foreground shadow-sm">
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
    </div>
  );
}

function TrackDetail({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-muted-foreground/60">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}

function PlaylistLink({ playlistId }: { playlistId: string }) {
  const { data: playlist } = usePlaylistInfo(playlistId);
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

function Queue({ media }: { media: CurrentMedia }) {
  const { playbackState, setMedia } = useMediaStateStore(
    useShallow((state) => ({
      playbackState: state.playbackState,
      setMedia: state.setMedia,
    })),
  );

  // The queue is whichever media list playback started from (playlist,
  // most played, listening history...). Subscribe to that list in the
  // query cache instead of fetching, so the panel always shows exactly
  // what next/prev will use.
  const { data: queue } = useQuery<Audiofile[] | null>({
    queryKey: media.queryKey,
    queryFn: skipToken,
  });
  const queueItems = queue ?? [];

  function playQueueItem(index: number) {
    setMedia(media.queryKey, index).catch((error) => {
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
                onClick={() => playQueueItem(index)}
                className={cn(
                  "grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-2.5 text-left transition-colors",
                  active ? "bg-primary/10" : "hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums text-muted-foreground",
                    active && "text-primary",
                  )}
                >
                  {active && playbackState === "playing" ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      active && "text-primary",
                    )}
                  >
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
      </div>
    </>
  );
}
