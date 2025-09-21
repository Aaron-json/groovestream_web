import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import TextLogo from "@/components/custom/textlogo";
import { createUserProfile, usernameExists } from "@/api/requests/user";
import { queryClient } from "@/lib/query";

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

const MAX_USERNAME_LENGTH = 25;
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
  const [usernameState, setUsernameState] = useState<
    "checking" | "available" | "unavailable" | undefined
  >(undefined);

  const {
    register,
    handleSubmit,
    getValues,
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

  const username = getValues("username");

  const checkAvailability = async () => {
    if (!username || username.length < 3) return;

    setUsernameState("checking");
    try {
      const available = !(await usernameExists(username));

      setUsernameState(available ? "available" : "unavailable");
      if (!available) {
        setError("username", {
          type: "manual",
          message: "This username is already taken",
        });
      } else {
        clearErrors("username");
      }
    } catch (err) {
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

    await createUserProfile({ username: data.username });
    queryClient.invalidateQueries({ queryKey: ["user-exists"] });
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
                  {errors.username && (
                    <Label className="text-xs text-red-500">
                      {errors.username.message}
                    </Label>
                  )}
                  {usernameState === "available" && (
                    <p className="text-sm text-green-600">available</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Input with icon */}
                  <div className="relative flex-1">
                    <Input
                      id="username"
                      type="text"
                      placeholder="your username"
                      maxLength={MAX_USERNAME_LENGTH}
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
                          clearErrors("username");
                        },
                      })}
                      className={`pr-10 ${
                        usernameState === "unavailable" || errors.username
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      disabled={usernameState === "checking"}
                    />
                    {usernameState === "available" && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                    {(usernameState === "unavailable" || errors.username) && (
                      <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={checkAvailability}
                    disabled={!!errors.username || usernameState === "checking"}
                    className="whitespace-nowrap w-16"
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

                <div className="mt-4">
                  <p className="text-xs text-muted-foreground italic">
                    Your username will be visible to others
                  </p>
                </div>
              </div>
              {/* ✅ Fixed-height container so layout doesn’t jump */}
              <div className="flex items-center"></div>

              {/* Root errors */}
              <div className="flex items-start justify-center">
                {errors.root && (
                  <p className="text-sm text-red-500">{errors.root.message}</p>
                )}
              </div>

              {/* Action buttons */}
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
