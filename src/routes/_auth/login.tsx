import { createFileRoute, Link } from "@tanstack/react-router";
import { SubmitHandler, useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { supabaseClient } from "@/auth/client";

type FormValues = {
  email: string;
  password: string;
};

export const Route = createFileRoute("/_auth/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin: SubmitHandler<FormValues> = async (data) => {
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError("root", {
          message: error.message,
        });
        return;
      }
      location.reload();
    } catch (err: any) {
      const message: string = err.message ?? "An unexpected error occurred.";
      setError("root", {
        message,
      });
    }
  };

  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm">Sign in to continue to your account</p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          {errors.root && (
            <div className="mb-4 flex items-center rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="text-sm">{errors.root.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            <div>
              <Label
                htmlFor="login-email"
                className="block text-sm font-medium pb-2"
              >
                Email
              </Label>
              <Input
                id="login-email"
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
                htmlFor="login-password"
                className="block text-sm font-medium pb-2"
              >
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                className="text-sm"
                {...register("password", {
                  required: "Password is required",
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
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              variant="ghost"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="mt-2 text-sm">
            Don't have an account?{" "}
            <Link
              from={Route.fullPath}
              to="/register"
              className="font-semibold underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
