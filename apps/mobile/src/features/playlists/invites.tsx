import {
  acceptPlaylistInvite,
  rejectPlaylistInvite,
} from "@groovestream/api/sdk";
import type { PlaylistInvite } from "@groovestream/api/models";
import {
  PLAYLISTS_LIST_KEY,
  removePlaylistInviteFromCache,
} from "@groovestream/query/media";
import { useMutation } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";

function invitePath(invite: PlaylistInvite) {
  return {
    playlist_id: invite.playlist_id,
    playlist_invite_sender_id: invite.from_id,
  };
}

export function PlaylistInvites({
  invites,
  hasMore,
  loadingMore,
  loadMoreFailed,
  onLoadMore,
}: {
  invites: PlaylistInvite[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreFailed: boolean;
  onLoadMore: () => void;
}) {
  const toast = useAppToast();
  const accept = useMutation({
    mutationFn: (invite: PlaylistInvite) =>
      acceptPlaylistInvite({ path: invitePath(invite) }),
    onSuccess: async (_data, invite) => {
      removePlaylistInviteFromCache(queryClient, invite);
      await queryClient.invalidateQueries({ queryKey: PLAYLISTS_LIST_KEY });
      toast.success("Invitation accepted", invite.playlist_name);
    },
    onError: (error) =>
      toast.error("Couldn't accept invitation", getErrorMessage(error, "Please try again")),
  });
  const reject = useMutation({
    mutationFn: (invite: PlaylistInvite) =>
      rejectPlaylistInvite({ path: invitePath(invite) }),
    onSuccess: (_data, invite) => removePlaylistInviteFromCache(queryClient, invite),
    onError: (error) =>
      toast.error("Couldn't decline invitation", getErrorMessage(error, "Please try again")),
  });

  if (!invites.length) return null;

  return (
    <View className="gap-2.5">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Pending Invitations ({invites.length})
      </Text>
      {invites.map((invite) => {
        const accepting = accept.isPending && accept.variables?.id === invite.id;
        const rejecting = reject.isPending && reject.variables?.id === invite.id;
        const pending = accept.isPending || reject.isPending;
        return (
          <View
            key={invite.id}
            className="gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <AppIcon name="mail-unread" size={18} colorClassName="accent-muted-foreground" />
              </View>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text numberOfLines={1} className="font-semibold text-card-foreground text-sm">
                  {invite.playlist_name}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  Invited by @{invite.from_username}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                isDisabled={pending}
                onPress={() => reject.mutate(invite)}
              >
                {rejecting ? <ButtonSpinner /> : null}
                <ButtonText>{rejecting ? "Declining…" : "Decline"}</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="default"
                isDisabled={pending}
                onPress={() => accept.mutate(invite)}
              >
                {accepting ? <ButtonSpinner /> : null}
                <ButtonText>{accepting ? "Accepting…" : "Accept"}</ButtonText>
              </Button>
            </View>
          </View>
        );
      })}
      {loadMoreFailed ? (
        <View className="items-start gap-1">
          <Text className="text-xs text-destructive">
            More invitations could not be loaded.
          </Text>
          <Button variant="ghost" size="sm" className="self-start" onPress={onLoadMore}>
            <ButtonText>Try again</ButtonText>
          </Button>
        </View>
      ) : hasMore ? (
        <Button variant="ghost" size="sm" className="self-start" isDisabled={loadingMore} onPress={onLoadMore}>
          {loadingMore ? <ButtonSpinner /> : null}
          <ButtonText>{loadingMore ? "Loading…" : "Load more invitations"}</ButtonText>
        </Button>
      ) : null}
    </View>
  );
}
