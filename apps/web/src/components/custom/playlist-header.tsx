import type { PlaylistDetails } from "@groovestream/api/models";
import { Link } from "@tanstack/react-router";
import {
  ListMusic,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  Pause,
  PencilLine,
  Play,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const playlistNavigation = [
  {
    label: "Tracks",
    to: "/library/playlists/$playlistId",
    icon: ListMusic,
  },
  {
    label: "Upload",
    to: "/library/playlists/$playlistId/upload",
    icon: Upload,
    requiresWrite: true,
  },
  {
    label: "Members",
    to: "/library/playlists/$playlistId/members",
    icon: Users,
  },
] as const;

type PlaylistPlaybackState = "idle" | "loading" | "playing";

type PlaylistHeaderProps = Readonly<{
  playlist: PlaylistDetails;
  playbackState: PlaylistPlaybackState;
  onPlayback: () => void;
  onRename: () => void;
  onDelete: () => void;
  onLeave: () => void;
}>;

const playlistDateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatPlaylistDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return playlistDateFormatter.format(date);
}

function playlistAccessLabel(accessLevel: PlaylistDetails["access_level"]) {
  switch (accessLevel) {
    case "OWNER":
      return "Owner";
    case "WRITE":
      return "Editor";
    case "READ":
      return "Viewer";
  }
}

export function PlaylistHeader({
  playlist,
  playbackState,
  onPlayback,
  onRename,
  onDelete,
  onLeave,
}: PlaylistHeaderProps) {
  const isLoading = playbackState === "loading";
  const isPlaying = playbackState === "playing";
  const isOwner = playlist.access_level === "OWNER";
  const canWrite =
    playlist.access_level === "WRITE" || playlist.access_level === "OWNER";

  const accessLabel = playlistAccessLabel(playlist.access_level);
  const formattedDate = formatPlaylistDate(playlist.created_at);

  return (
    <header className="w-full min-w-0 pt-1 sm:pt-2">
      <div className="flex min-w-0 flex-col items-center text-center sm:flex-row sm:items-stretch sm:text-left">
        <div
          className="mb-4 flex size-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:mb-0 sm:mr-5 sm:size-32"
          aria-hidden="true"
        >
          <ListMusic className="size-9 sm:size-11" />
        </div>

        <div className="flex w-full min-w-0 flex-col items-center sm:min-h-32 sm:flex-1 sm:items-start">
          <div className="flex flex-1 flex-col justify-center">
            <h1
              className="break-words text-2xl font-semibold tracking-tight sm:text-3xl"
              title={playlist.name}
            >
              {playlist.name}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              By{" "}
              <span className="text-foreground">{playlist.owner_username}</span>
              {formattedDate && (
                <>
                  <span className="px-1.5" aria-hidden="true">
                    ·
                  </span>
                  <time dateTime={playlist.created_at}>{formattedDate}</time>
                </>
              )}
            </p>
          </div>

          <div
            className="mt-4 flex items-center justify-center gap-1 sm:mt-0 sm:justify-start"
            role="group"
            aria-label="Playlist actions"
          >
            <Button
              type="button"
              onClick={onPlayback}
              size="sm"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin" />
              ) : isPlaying ? (
                <Pause />
              ) : (
                <Play className="translate-x-px" />
              )}
              {isLoading ? "Loading" : isPlaying ? "Pause" : "Play"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More playlist actions"
                  >
                    <MoreHorizontal />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{accessLabel} access</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canWrite && (
                    <DropdownMenuItem onClick={onRename}>
                      <PencilLine />
                      Rename playlist
                    </DropdownMenuItem>
                  )}
                  {canWrite && <DropdownMenuSeparator />}
                  {isOwner ? (
                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                      <Trash2 />
                      Delete playlist
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onLeave}>
                      <LogOut />
                      Leave playlist
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <nav
        aria-label="Playlist sections"
        className="mt-5 w-full border-b"
      >
        <div className="flex items-center justify-center overflow-x-auto [scrollbar-width:none] sm:justify-start">
          {playlistNavigation
            .filter((item) => !("requiresWrite" in item) || canWrite)
            .map((item) => (
              <Link
                key={item.to}
                to={item.to}
                params={{ playlistId: playlist.id }}
                activeOptions={{ exact: true }}
                className="-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                activeProps={{
                  className: "border-primary text-foreground",
                  "aria-current": "page",
                }}
                inactiveProps={{
                  className:
                    "border-transparent text-muted-foreground hover:text-foreground",
                }}
              >
                <item.icon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
        </div>
      </nav>
    </header>
  );
}

export function PlaylistHeaderSkeleton() {
  return (
    <div className="w-full min-w-0 pt-1 sm:pt-2">
      <div className="flex min-w-0 flex-col items-center sm:flex-row sm:items-stretch">
        <Skeleton className="mb-4 size-24 shrink-0 rounded-lg sm:mb-0 sm:mr-5 sm:size-32" />

        <div className="flex w-full min-w-0 flex-col items-center sm:min-h-32 sm:flex-1 sm:items-start">
          <div className="flex flex-1 flex-col justify-center">
            <Skeleton className="h-7 w-48 max-w-full sm:h-9 sm:w-72" />
            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
          </div>
          <div className="mt-4 flex items-center gap-1 sm:mt-0">
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="size-7 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center border-b pb-px sm:justify-start">
        <Skeleton className="h-8 w-20 rounded-none" />
        <Skeleton className="h-8 w-20 rounded-none" />
        <Skeleton className="h-8 w-20 rounded-none" />
      </div>
    </div>
  );
}
