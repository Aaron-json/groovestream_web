import { useState } from "react";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Crown,
  LoaderCircle,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import type { PlaylistMember } from "@groovestream/api/models";
import {
  flattenInfiniteData,
  playlistInfoOptions,
  playlistMembersOptions,
} from "@groovestream/query/media";
import AddPlaylistMemberSheet from "@/components/custom/add-playlist-member";
import { CustomAvatar, CustomAvatarSkeleton } from "@/components/custom/avatar";
import { InfiniteList } from "@/components/custom/infinite-list";
import InfoCard from "@/components/custom/info-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/query";
import {
  useRemovePlaylistMember,
  useUpdatePlaylistMemberAccess,
} from "@/query/media";

export const Route = createFileRoute(
  "/_authenticated/library/playlists/$playlistId/members",
)({
  component: RouteComponent,
  loader: ({ params }) =>
    queryClient.prefetchInfiniteQuery(
      playlistMembersOptions(params.playlistId),
    ),
  pendingMs: 200,
  pendingComponent: MembersPending,
  errorComponent: () => (
    <InfoCard
      variant="destructive"
      title="Unable to load members"
      text="Please refresh the page and try again."
    />
  ),
  staticData: {
    crumbs: (params) => [
      {
        label: "Members",
        to: "/library/playlists/$playlistId/members",
        params,
      },
    ],
  },
});

function RouteComponent() {
  const { playlistId } = Route.useParams();
  const { user } = useRouteContext({ from: "__root__" });
  const { data: playlist } = useSuspenseQuery(playlistInfoOptions(playlistId));
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useSuspenseInfiniteQuery(playlistMembersOptions(playlistId));
  const updateAccess = useUpdatePlaylistMemberAccess();
  const removeMember = useRemovePlaylistMember();
  const [memberToRemove, setMemberToRemove] = useState<PlaylistMember>();

  const members = flattenInfiniteData(data, (page) => page.data ?? []);
  const isOwner = playlist.access_level === "OWNER";
  const pagination = {
    loadMore: fetchNextPage,
    hasMore: hasNextPage ?? false,
    isLoading: isFetchingNextPage,
    isError: isFetchNextPageError,
  };

  function changeAccess(
    member: PlaylistMember,
    accessLevel: PlaylistMember["access_level"],
  ) {
    if (member.access_level === accessLevel) return;
    updateAccess.mutate(
      { playlistId, memberId: member.user_id, accessLevel },
      {
        onSuccess: () =>
          toast.success(
            `Updated ${member.username}'s access to ${accessLabel(accessLevel).toLowerCase()}`,
          ),
        onError: () =>
          toast.error(`Could not update ${member.username}'s access`),
      },
    );
  }

  function confirmRemove() {
    if (!memberToRemove) return;
    const member = memberToRemove;
    setMemberToRemove(undefined);
    removeMember.mutate(
      { playlistId, memberId: member.user_id },
      {
        onSuccess: () => toast.success(`${member.username} was removed`),
        onError: () => toast.error(`Could not remove ${member.username}`),
      },
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <span>Members</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({1 + members.length}
              {hasNextPage ? "+" : ""})
            </span>
          </CardTitle>
          <CardDescription>
            {isOwner
              ? "Manage who can listen and edit this playlist."
              : "People with access to this playlist."}
          </CardDescription>
          {isOwner && (
            <CardAction>
              <AddPlaylistMemberSheet
                playlistId={playlistId}
                trigger={
                  <Button size="sm">
                    <UserRoundPlus />
                    Invite
                  </Button>
                }
              />
            </CardAction>
          )}
        </CardHeader>

        <CardContent className="@container p-3 sm:p-4">
          <InfiniteList pagination={pagination}>
            <div className="grid grid-cols-1 gap-2.5 @[640px]:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 transition-colors hover:bg-muted/30">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CustomAvatar
                    username={playlist.owner_username}
                    className="size-8 shrink-0 text-xs"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="truncate text-sm font-medium text-foreground"
                        title={playlist.owner_username}
                      >
                        {playlist.owner_username}
                      </span>
                      {user?.id === playlist.owner_id && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      Created {formatDate(playlist.created_at)}
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Crown className="size-3" />
                  Owner
                </span>
              </div>

              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CustomAvatar
                      username={member.username}
                      className="size-8 shrink-0 text-xs"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="truncate text-sm font-medium text-foreground"
                          title={member.username}
                        >
                          {member.username}
                        </span>
                        {user?.id === member.user_id && (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                            You
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        Joined {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 px-2 text-xs font-normal"
                              disabled={
                                updateAccess.isPending &&
                                updateAccess.variables?.memberId ===
                                  member.user_id
                              }
                            >
                              {updateAccess.isPending &&
                              updateAccess.variables?.memberId ===
                                member.user_id ? (
                                <LoaderCircle className="size-3 animate-spin" />
                              ) : null}
                              <span>{accessLabel(member.access_level)}</span>
                              <ChevronDown className="size-3 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => changeAccess(member, "read")}
                            className="gap-2 text-xs"
                          >
                            <span className="flex size-3.5 items-center justify-center">
                              {member.access_level === "read" && (
                                <Check className="size-3.5 text-primary" />
                              )}
                            </span>
                            Can view
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => changeAccess(member, "write")}
                            className="gap-2 text-xs"
                          >
                            <span className="flex size-3.5 items-center justify-center">
                              {member.access_level === "write" && (
                                <Check className="size-3.5 text-primary" />
                              )}
                            </span>
                            Can edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${member.username}`}
                        className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className="inline-flex shrink-0 items-center rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {accessLabel(member.access_level)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {members.length === 0 && !hasNextPage && !isOwner && (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UserRoundPlus className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>No other members yet</EmptyTitle>
                  <EmptyDescription>
                    Only the owner currently has access to this playlist.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </InfiniteList>
        </CardContent>
      </Card>

      <AlertDialog
        open={memberToRemove !== undefined}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.username} will lose access to this playlist and
              its tracks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function accessLabel(accessLevel: PlaylistMember["access_level"]) {
  return accessLevel === "write" ? "Can edit" : "Can view";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MembersPending() {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <Skeleton className="h-5 w-24" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent className="@container p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2.5 @[640px]:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <CustomAvatarSkeleton className="size-8 shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-7 w-20 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
