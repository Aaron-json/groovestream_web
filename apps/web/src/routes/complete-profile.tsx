import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextLogo } from "@/components/custom/textlogo";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/query";

export const Route = createFileRoute("/complete-profile")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/auth" });
    }
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
});

function RouteComponent() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const availability = useMutation(usernameAvailabilityMutationOptions());
  const createProfile = useMutation(createProfileMutationOptions());

  const form = useForm({
    defaultValues: {
      username: "",
    },
    validators: {
      onSubmit: ({ value }) => {
        if (!session) return "Your session expired. Please sign in again.";
        if (
          availability.data?.username !== value.username ||
          !availability.data.available
        ) {
          return "Please check availability before continuing.";
        }
      },
    },
    onSubmit: async ({ value }) => {
      const username = value.username;
      if (!session) return;
      await createProfile.mutateAsync(username);
      await queryClient.invalidateQueries({
        queryKey: userKey(session.user.id),
      });
      await navigate({ to: "/" });
    },
  });

  const submit = () => {
    void form.handleSubmit().catch(() => {
      // The create-profile mutation state below owns submit errors.
    });
  };

  return (
    <div className="h-full flex flex-col items-center bg-background p-4 gap-8">
      <div className="flex flex-none items-center justify-center h-28">
        <TextLogo />
      </div>
      <div className="flex flex-col justify-start w-full max-w-lg">
        <Card>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Almost there!</CardTitle>
            <p className="text-muted-foreground">
              Choose a username to complete your profile
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="space-y-4"
            >
              <form.Field
                name="username"
                validators={{ onChange: ({ value }) => validateUsername(value) }}
              >
                {(field) => {
                  const isCurrentCheck =
                    availability.variables === field.state.value;
                  const isCurrentSubmission =
                    createProfile.variables === field.state.value;
                  const fieldError = field.state.meta.errors[0];
                  const availabilityError =
                    isCurrentCheck && availability.isError
                      ? "Failed to check availability"
                      : isCurrentCheck &&
                          availability.isSuccess &&
                          !availability.data.available
                        ? "This username is already taken"
                        : undefined;
                  const usernameTaken =
                    isCurrentSubmission &&
                    isApiError(createProfile.error) &&
                    createProfile.error.error_code === "USERNAME_TAKEN";
                  const checking = isCurrentCheck && availability.isPending;
                  const available =
                    isCurrentCheck &&
                    availability.isSuccess &&
                    availability.data.available &&
                    !usernameTaken;
                  const serverError = usernameTaken
                    ? "This username is already taken"
                    : availabilityError;

                  return (
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center h-6">
                        <Label htmlFor="username">Username</Label>
                        {available && (
                          <p className="text-sm text-primary">Available</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="username"
                            name={field.name}
                            type="text"
                            placeholder="your username"
                            maxLength={USERNAME_MAX_LENGTH}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                              availability.reset();
                              createProfile.reset();
                              form.setErrorMap({ onSubmit: undefined });
                              field.handleChange(event.target.value);
                            }}
                            aria-invalid={!!fieldError || !!serverError}
                            aria-describedby={
                              fieldError || serverError
                                ? "username-error"
                                : undefined
                            }
                            className="pr-10"
                            disabled={checking}
                          />
                          {available && (
                            <CheckCircle className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-primary" />
                          )}
                          {(fieldError || serverError) && (
                            <AlertCircle className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-destructive" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            createProfile.reset();
                            availability.mutate(field.state.value);
                          }}
                          disabled={
                            !!validateUsername(field.state.value) || checking
                          }
                          className="min-w-20"
                        >
                          {checking ? "..." : "Check"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only letters, numbers, underscores and hyphens.{" "}
                        {field.state.value.length}/{USERNAME_MAX_LENGTH}
                      </p>
                      {(fieldError || serverError) && (
                        <p
                          id="username-error"
                          className="text-sm text-destructive"
                        >
                          {String(fieldError ?? serverError)}
                        </p>
                      )}
                      <p className="pt-3 text-xs text-muted-foreground italic">
                        Your username will be visible to others
                      </p>
                    </div>
                  );
                }}
              </form.Field>

              <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
                {(error) =>
                  error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{String(error)}</AlertDescription>
                    </Alert>
                  ) : null
                }
              </form.Subscribe>
              {createProfile.isError &&
                !(
                  isApiError(createProfile.error) &&
                  createProfile.error.error_code === "USERNAME_TAKEN"
                ) && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {isApiError(createProfile.error)
                        ? createProfile.error.message
                        : "Unable to create your profile. Please try again."}
                    </AlertDescription>
                  </Alert>
                )}

              <div className="flex justify-center">
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
                    ) {
                      return "disabled";
                    }
                    return "ready";
                  }}
                >
                  {(submitState) => (
                    <Button
                      type="submit"
                      disabled={submitState !== "ready"}
                      className="max-w-xs"
                    >
                      {submitState === "submitting"
                        ? "Loading..."
                        : "Complete Profile"}
                    </Button>
                  )}
                </form.Subscribe>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
