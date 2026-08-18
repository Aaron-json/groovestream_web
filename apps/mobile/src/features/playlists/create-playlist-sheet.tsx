import { createPlaylist } from "@groovestream/api/sdk";
import { addPlaylistToCache } from "@groovestream/query/media";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { useAppToast } from "@/components/app-toast";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
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
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";

export function CreatePlaylistSheet() {
  const toast = useAppToast();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (name: string) => createPlaylist({ body: { name } }),
  });
  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      const playlist = await mutation.mutateAsync(value.name.trim());
      addPlaylistToCache(queryClient, playlist);
      formApi.reset();
      setOpen(false);
      toast.success("Playlist created", playlist.name);
    },
  });

  const close = () => {
    setOpen(false);
    form.reset();
    mutation.reset();
  };
  const submit = () => void form.handleSubmit().catch(() => undefined);

  return (
    <>
      <Button
        size="sm"
        variant="default"
        onPress={() => setOpen(true)}
        className="rounded-full"
      >
        <AppIcon
          name="add"
          size={16}
          colorClassName="accent-primary-foreground"
        />
        <ButtonText>New playlist</ButtonText>
      </Button>
      <Actionsheet isOpen={open} onClose={close} useRNModal>
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper className="items-center py-2">
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <View className="gap-5 pb-2 pt-2">
            <View className="gap-1">
              <Text className="text-xl font-bold tracking-tight text-foreground">
                New Playlist
              </Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                Give your playlist a name to organize your favorite tracks.
              </Text>
            </View>
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : "Playlist name is required",
              }}
            >
              {(field) => {
                const error = field.state.meta.errors[0];
                return (
                  <FormControl isInvalid={Boolean(error)}>
                    <FormControlLabel>
                      <FormControlLabelText>Playlist Name</FormControlLabelText>
                    </FormControlLabel>
                    <Input>
                      <InputField
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={(value) => {
                          mutation.reset();
                          field.handleChange(value);
                        }}
                        onSubmitEditing={submit}
                        returnKeyType="done"
                        placeholder="e.g. Late Night Vibes"
                        maxLength={100}
                        autoFocus
                      />
                    </Input>
                    {error ? (
                      <FormControlError>
                        <FormControlErrorText>{String(error)}</FormControlErrorText>
                      </FormControlError>
                    ) : null}
                  </FormControl>
                );
              }}
            </form.Field>
            {mutation.isError ? (
              <Text className="text-xs text-destructive">
                {getErrorMessage(mutation.error, "The playlist could not be created")}
              </Text>
            ) : null}
            <View className="flex-row justify-end gap-3 pt-2">
              <Button variant="ghost" onPress={close}>
                <ButtonText>Cancel</ButtonText>
              </Button>
              <form.Subscribe
                selector={(state) =>
                  state.isSubmitting
                    ? "submitting"
                    : state.canSubmit && !state.isPristine
                      ? "ready"
                      : "disabled"
                }
              >
                {(state) => (
                  <Button isDisabled={state !== "ready"} onPress={submit}>
                    {state === "submitting" ? <ButtonSpinner /> : null}
                    <ButtonText>{state === "submitting" ? "Creating…" : "Create"}</ButtonText>
                  </Button>
                )}
              </form.Subscribe>
            </View>
          </View>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
