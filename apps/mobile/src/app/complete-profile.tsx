import { isApiError } from "@groovestream/api/errors";
import {
  USERNAME_MAX_LENGTH,
  validateUsername,
} from "@groovestream/api/username";
import {
  createProfileMutationOptions,
  userKey,
  usernameAvailabilityMutationOptions,
} from "@groovestream/query/user";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Logo } from "@/components/logo";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-provider";
import { getErrorMessage } from "@/lib/errors";
import { queryClient } from "@/lib/query";
import { useNavigationColors } from "@/lib/theme";

export default function CompleteProfileScreen() {
  const { session } = useAuth();
  const colors = useNavigationColors();
  const availability = useMutation(usernameAvailabilityMutationOptions());
  const createProfile = useMutation(createProfileMutationOptions());
  const form = useForm({
    defaultValues: { username: "" },
    validators: {
      onSubmit: ({ value }) => {
        if (!session) return "Your session expired. Please sign in again.";
        if (
          availability.data?.username !== value.username ||
          !availability.data.available
        ) {
          return "Check that your username is available before continuing.";
        }
      },
    },
    onSubmit: async ({ value }) => {
      if (!session) return;
      await createProfile.mutateAsync(value.username);
      await queryClient.invalidateQueries({ queryKey: userKey(session.user.id) });
    },
  });

  const submit = () => void form.handleSubmit().catch(() => undefined);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center gap-8 px-6 py-8">
          <Logo size="md" />
          <View className="gap-2">
            <Text className="text-3xl font-extrabold tracking-tight text-foreground">
              Choose your username
            </Text>
            <Text className="text-sm leading-6 text-muted-foreground">
              This is how your friends and collaborators will recognize you on GrooveStream.
            </Text>
          </View>

          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => validateUsername(value) }}
          >
            {(field) => {
              const checkingCurrent = availability.variables === field.state.value;
              const submittingCurrent = createProfile.variables === field.state.value;
              const usernameTaken =
                submittingCurrent &&
                isApiError(createProfile.error) &&
                createProfile.error.error_code === "USERNAME_TAKEN";
              const available =
                checkingCurrent &&
                availability.isSuccess &&
                availability.data.available &&
                !usernameTaken;
              const availabilityError =
                checkingCurrent && availability.isError
                  ? getErrorMessage(availability.error, "Availability could not be checked")
                  : checkingCurrent && availability.isSuccess && !availability.data.available
                    ? "That username is already taken"
                    : usernameTaken
                      ? "That username is already taken"
                      : undefined;
              const fieldError = field.state.meta.errors[0];
              const invalid = Boolean(fieldError || availabilityError);

              return (
                <FormControl isInvalid={invalid}>
                  <FormControlLabel>
                    <FormControlLabelText>Username</FormControlLabelText>
                  </FormControlLabel>
                  <View className="flex-row gap-2.5">
                    <Input className="flex-1">
                      <InputField
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChangeText={(value) => {
                          availability.reset();
                          createProfile.reset();
                          form.setErrorMap({ onSubmit: undefined });
                          field.handleChange(value);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={USERNAME_MAX_LENGTH}
                        placeholder="e.g. alexgrooves"
                        returnKeyType="done"
                      />
                    </Input>
                    <Button
                      variant="outline"
                      isDisabled={
                        Boolean(validateUsername(field.state.value)) ||
                        (checkingCurrent && availability.isPending)
                      }
                      onPress={() => {
                        createProfile.reset();
                        availability.mutate(field.state.value);
                      }}
                    >
                      {checkingCurrent && availability.isPending ? <ButtonSpinner /> : null}
                      <ButtonText>Check</ButtonText>
                    </Button>
                  </View>
                  {invalid ? (
                    <FormControlError>
                      <FormControlErrorText>
                        {String(fieldError ?? availabilityError)}
                      </FormControlErrorText>
                    </FormControlError>
                  ) : (
                    <FormControlHelper>
                      <FormControlHelperText>
                        {available ? (
                          <Text className="font-semibold text-emerald-400">
                            ✓ Username is available!
                          </Text>
                        ) : (
                          "3–32 characters using letters, numbers, _ or -."
                        )}
                      </FormControlHelperText>
                    </FormControlHelper>
                  )}
                </FormControl>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
            {(error) =>
              error ? (
                <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                  <Text className="text-xs text-destructive">{String(error)}</Text>
                </View>
              ) : null
            }
          </form.Subscribe>

          {createProfile.isError &&
          !(isApiError(createProfile.error) && createProfile.error.error_code === "USERNAME_TAKEN") ? (
            <View className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <Text className="text-xs text-destructive">
                {getErrorMessage(createProfile.error, "Your profile could not be created")}
              </Text>
            </View>
          ) : null}

          <form.Subscribe
            selector={(state) => {
              const username = state.values.username;
              if (state.isSubmitting) return "submitting";
              if (
                !state.canSubmit ||
                availability.data?.username !== username ||
                !availability.data.available ||
                (createProfile.variables === username &&
                  isApiError(createProfile.error) &&
                  createProfile.error.error_code === "USERNAME_TAKEN")
              ) return "disabled";
              return "ready";
            }}
          >
            {(state) => (
              <Button
                size="lg"
                className="rounded-2xl"
                isDisabled={state !== "ready"}
                onPress={submit}
              >
                {state === "submitting" ? <ButtonSpinner /> : null}
                <ButtonText>
                  {state === "submitting" ? "Saving…" : "Open my library"}
                </ButtonText>
              </Button>
            )}
          </form.Subscribe>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
