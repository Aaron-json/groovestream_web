import { isApiError } from "@groovestream/api/errors";
import type { Playlist } from "@groovestream/api/models";
import { deletePlaylist, leavePlaylist, sendPlaylistInvite } from "@groovestream/api/sdk";
import { usePlaybackStore } from "@groovestream/media/playback-store";
import { removePlaylistFromCache } from "@groovestream/query/media";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { type Href, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";

type Sheet = "actions" | "invite" | null;

export function PlaylistActionsSheet({ playlist }: { playlist: Playlist }) {
  const toast = useAppToast();
  const { session } = useAuth();
  const [sheet, setSheet] = useState<Sheet>(null);
  const isOwner = playlist.owner_id === session?.user.id;

  const invite = useMutation({
    mutationFn: (username: string) =>
      sendPlaylistInvite({ body: { playlist_id: playlist.id, username } }),
  });
  const inviteForm = useForm({
    defaultValues: { username: "" },
    onSubmit: async ({ value, formApi }) => {
      const username = value.username.trim();
      await invite.mutateAsync(username);
      toast.success("Invitation sent", username);
      formApi.reset();
      setSheet(null);
    },
  });
  const removePlaylist = useMutation({
    mutationFn: () => deletePlaylist({ path: { playlist_id: playlist.id } }),
    onSuccess: () => finishRemoval("Playlist deleted"),
    onError: (error) =>
      toast.error(
        "Couldn't delete playlist",
        getErrorMessage(error, "Please try again"),
      ),
  });
  const leave = useMutation({
    mutationFn: () => leavePlaylist({ path: { playlist_id: playlist.id } }),
    onSuccess: () => finishRemoval("You left the playlist"),
    onError: (error) =>
      toast.error(
        "Couldn't leave playlist",
        getErrorMessage(error, "Please try again"),
      ),
  });

  function finishRemoval(message: string) {
    const playback = usePlaybackStore.getState();
    if (
      playback.playerState.currentMedia?.audiofile.playlist_id === playlist.id
    ) {
      playback.unloadMedia();
    }
    removePlaylistFromCache(queryClient, playlist.id);
    toast.success(message, playlist.name);
    router.replace("/library" as Href);
  }

  const close = () => {
    setSheet(null);
    invite.reset();
    inviteForm.reset();
  };

  const confirmRemoval = () => {
    close();
    if (isOwner) {
      Alert.alert(
        "Delete playlist?",
        `“${playlist.name}” and all of its tracks will be permanently removed.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => removePlaylist.mutate(),
          },
        ],
      );
      return;
    }

    Alert.alert("Leave playlist?", `You will lose access to “${playlist.name}”.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => leave.mutate() },
    ]);
  };

  const submitInvite = () => void inviteForm.handleSubmit().catch(() => undefined);

  return (
    <>
      <Pressable
        className="h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card active:bg-accent"
        onPress={() => setSheet("actions")}
        accessibilityRole="button"
        accessibilityLabel="Playlist actions"
      >
        <AppIcon name="ellipsis-horizontal" size={20} colorClassName="accent-foreground" />
      </Pressable>

      <Actionsheet isOpen={sheet !== null} onClose={close} useRNModal>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper className="items-center py-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          {sheet === "actions" ? (
            <View className="gap-1 pb-2">
              <View className="px-3 pb-3 pt-1">
                <Text className="text-lg font-bold tracking-tight text-foreground">
                  {playlist.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  By {playlist.owner_username}
                </Text>
              </View>
              {isOwner ? (
                <ActionsheetItem onPress={() => setSheet("invite")}>
                  <AppIcon name="person-add-outline" size={20} colorClassName="accent-foreground" />
                  <ActionsheetItemText>Invite member</ActionsheetItemText>
                </ActionsheetItem>
              ) : null}
              <ActionsheetItem onPress={confirmRemoval}>
                <AppIcon
                  name={isOwner ? "trash-outline" : "log-out-outline"}
                  size={20}
                  colorClassName="accent-destructive"
                />
                <ActionsheetItemText className="text-destructive">
                  {isOwner ? "Delete playlist" : "Leave playlist"}
                </ActionsheetItemText>
              </ActionsheetItem>
            </View>
          ) : sheet === "invite" ? (
            <View className="gap-5 pb-2 pt-1">
              <View className="gap-1">
                <Text className="text-xl font-bold tracking-tight text-foreground">
                  Invite a Member
                </Text>
                <Text className="text-xs leading-5 text-muted-foreground">
                  Enter the Groovestream username of the person you want to invite.
                </Text>
              </View>
              <inviteForm.Field
                name="username"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() ? undefined : "Username is required",
                }}
              >
                {(field) => {
                  const fieldError = field.state.meta.errors[0];
                  const serverError = invite.isError
                    ? getInviteErrorMessage(invite.error)
                    : undefined;
                  return (
                    <FormControl isInvalid={Boolean(fieldError || serverError)}>
                      <FormControlLabel>
                        <FormControlLabelText>Username</FormControlLabelText>
                      </FormControlLabel>
                      <Input>
                        <InputField
                          autoFocus
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChangeText={(value) => {
                            invite.reset();
                            field.handleChange(value);
                          }}
                          onSubmitEditing={submitInvite}
                          placeholder="e.g. janesmith"
                          returnKeyType="send"
                        />
                      </Input>
                      {fieldError || serverError ? (
                        <FormControlError>
                          <FormControlErrorText>
                            {String(fieldError ?? serverError)}
                          </FormControlErrorText>
                        </FormControlError>
                      ) : null}
                    </FormControl>
                  );
                }}
              </inviteForm.Field>
              <View className="flex-row justify-end gap-3 pt-2">
                <Button variant="ghost" onPress={close}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <inviteForm.Subscribe
                  selector={(state) =>
                    state.isSubmitting
                      ? "submitting"
                      : state.canSubmit && !state.isPristine
                        ? "ready"
                        : "disabled"
                  }
                >
                  {(state) => (
                    <Button isDisabled={state !== "ready"} onPress={submitInvite}>
                      {state === "submitting" ? <ButtonSpinner /> : null}
                      <ButtonText>
                        {state === "submitting" ? "Sending…" : "Send invite"}
                      </ButtonText>
                    </Button>
                  )}
                </inviteForm.Subscribe>
              </View>
            </View>
          ) : null}
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}

function getInviteErrorMessage(error: unknown) {
  if (!isApiError(error)) return "The invitation could not be sent";
  switch (error.error_code) {
    case "USER_NOT_FOUND":
      return "User not found";
    case "SELF_INVITE":
      return "You cannot invite yourself";
    case "USER_IS_MEMBER":
      return "This user is already in the playlist";
    case "INVITE_EXISTS":
      return "This user already has an invitation";
    default:
      return error.message;
  }
}
