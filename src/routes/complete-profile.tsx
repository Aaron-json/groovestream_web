import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { TextLogo } from "@/components/custom/textlogo";
import {
  checkUsernameExists,
  createUserProfile,
} from "@/api/generated/sdk.gen";
import { isApiError } from "@/api/types";
import { queryClient } from "@/lib/query";
import { userKey } from "@/query/user";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/complete-profile")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth",
      });
    }
    if (context.user) {
      throw redirect({
        to: "/",
      });
    }
  },
});

const MAX_USERNAME_LENGTH = 32;
const MIN_USERNAME_LENGTH = 3;

function validateUsername(username: string) {
  // Allowed characters only (letters, numbers, underscores, hyphens)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return "can only contain letters, numbers, underscores, and hyphens.";
  }

  // At least one letter
  if (!/[a-zA-Z]/.test(username)) {
    return "must contain at least one letter.";
  }

  // Cannot start with _ or -
  if (username.startsWith("_") || username.startsWith("-")) {
    return "cannot start with a hyphen or underscore.";
  }

  // cannot have consecutive _ or -
  if (/[_-]{2}/.test(username)) {
    return "cannot contain consecutive hyphens or underscores.";
  }

  return true;
}

function RouteComponent() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [usernameState, setUsernameState] = useState<
    "checking" | "available" | "unavailable" | undefined
  >(undefined);

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { isSubmitting },
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      username: "",
    },
  });

  const username = useWatch({ control, name: "username" });

  const checkAvailability = async () => {
    if (!username || username.length < 3) return;

    setUsernameState("checking");
    try {
      const available = !(
        await checkUsernameExists({ query: { username } })
      );

      setUsernameState(available ? "available" : "unavailable");
      if (!available) {
        setError("username", {
          type: "manual",
          message: "This username is already taken",
        });
      } else {
        clearErrors("username");
      }
    } catch {
      setError("username", {
        type: "manual",
        message: "Failed to check availability",
      });
    }
  };

  const onSubmit = async (data: { username: string }) => {
    if (usernameState !== "available") {
      setError("username", {
        type: "manual",
        message: "Please check availability before continuing",
      });
      return;
    }

    if (!session) {
      setError("root", {
        message: "Your session expired. Please sign in again.",
      });
      return;
    }

    try {
      await createUserProfile({ body: { username: data.username } });
      await queryClient.invalidateQueries({
        queryKey: userKey(session.user.id),
      });
      await navigate({ to: "/" });
    } catch (error) {
      if (
        isApiError(error) &&
        error.http_code === 409 &&
        error.error_code === "USERNAME_TAKEN"
      ) {
        setUsernameState("unavailable");
        setError("username", {
          type: "server",
          message: "This username is already taken",
        });
        return;
      }

      if (
        isApiError(error) &&
        error.http_code === 409 &&
        error.error_code === "PROFILE_EXISTS"
      ) {
        await queryClient.invalidateQueries({
          queryKey: userKey(session.user.id),
        });
        await navigate({ to: "/" });
        return;
      }

      setError("root", {
        message: isApiError(error)
          ? error.message
          : "Unable to create your profile. Please try again.",
      });
    }
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <div className="flex gap-2 items-center h-6">
                  <Label htmlFor="username">Username</Label>
                  {usernameState === "available" && (
                    <p className="text-sm text-primary">Available</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="username"
                      type="text"
                      placeholder="your username"
                      maxLength={MAX_USERNAME_LENGTH}
                      aria-invalid={!!errors.username}
                      aria-describedby={
                        errors.username ? "username-error" : undefined
                      }
                      {...register("username", {
                        required: "required",
                        minLength: {
                          value: MIN_USERNAME_LENGTH,
                          message: `Must be at least ${MIN_USERNAME_LENGTH} characters`,
                        },
                        maxLength: {
                          value: MAX_USERNAME_LENGTH,
                          message: `Must be no more than ${MAX_USERNAME_LENGTH} characters`,
                        },
                        validate: validateUsername,
                        onChange: () => {
                          setUsernameState(undefined);
                          clearErrors();
                        },
                      })}
                      className="pr-10"
                      disabled={usernameState === "checking"}
                    />
                    {usernameState === "available" && (
                      <CheckCircle className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-primary" />
                    )}
                    {(usernameState === "unavailable" || errors.username) && (
                      <AlertCircle className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-destructive" />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkAvailability}
                    disabled={!isValid || usernameState === "checking"}
                    className="min-w-20"
                  >
                    {usernameState === "checking" ? "..." : "Check"}
                  </Button>
                </div>

                <div className="flex flex-col text-xs text-muted-foreground">
                  <span>
                    Only letters, numbers, underscores and hyphens.{" "}
                    {username?.length || 0}/{MAX_USERNAME_LENGTH}
                  </span>
                </div>

                {errors.username?.message && (
                  <p id="username-error" className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground italic">
                    Your username will be visible to others
                  </p>
                </div>
              </div>
              {errors.root?.message && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={
                    usernameState !== "available" || isSubmitting || !isValid
                  }
                  className="max-w-xs"
                >
                  {isSubmitting ? "Loading..." : "Complete Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
