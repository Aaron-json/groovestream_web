import { createFileRoute, Link } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";
import { createUser } from "@/api/requests/user";
import { ResponseError } from "@/api/types/errors";
import { isAxiosError } from "axios";

type FormValues = {
  email: string;
  username: string;
  password: string;
};

export const Route = createFileRoute("/_auth/register")({
  component: RouteComponent,
});

export function RouteComponent() {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const handleRegister: SubmitHandler<FormValues> = async (data) => {
    clearErrors();
    try {
      await createUser(data);
    } catch (error) {
      let message = "An error occurred";
      if (isAxiosError<ResponseError>(error)) {
        const errorCode = error.response?.data.error_code;
        if (errorCode === "USERNAME_EXISTS") {
          message = "Username already exists";
        } else if (errorCode === "INVALID_EMAIL") {
          message = "This email cannot be used to register";
        }
      }
      setError("root", {
        message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm">Sign up to get started</p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          {errors.root && (
            <div className="mb-4 flex items-center rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="text-sm">{errors.root.message}</span>
            </div>
          )}
          {isSubmitSuccessful && (
            <div className="flex items-center rounded-md border p-2">
              <Check className="mr-2 h-5 w-5" />
              <span className="text-sm">
                Account created successfully. Check your email for a
                verification link then log in to continue.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
            <div>
              <Label
                htmlFor="reg-email"
                className="block text-sm font-medium pb-2"
              >
                Email
              </Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                className="text-sm"
                {...register("email", {
                  required: "Email is required",
                  validate: (email) =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                    "Invalid email address",
                })}
              />
              {errors.email && (
                <p className="mt-1 flex items-center text-xs text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="username"
                className="block text-sm font-medium pb-2"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                className="text-sm"
                {...register("username", {
                  required: "Username is required",
                  minLength: {
                    value: 2,
                    message: "Username must be at least 2 characters",
                  },
                })}
              />
              {errors.username && (
                <p className="mt-1 flex items-center text-xs text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="reg-password"
                className="block text-sm font-medium pb-2"
              >
                Password
              </Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Create a password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters long",
                  },
                })}
              />
              {errors.password && (
                <p className="mt-1 flex items-center text-xs text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Register"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link
              from={Route.fullPath}
              to="/login"
              className="font-semibold underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RouteComponent;
