import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { createUser } from '@/api/requests/user'

type FormValues = {
  email: string
  username: string
  password: string
}

export const Route = createFileRoute('/_auth/register')({
  component: RouteComponent,
})

export function RouteComponent() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  })

  const handleRegister: SubmitHandler<FormValues> = async (data) => {
    setAuthError(null)
    setIsSubmitting(true)

    try {
      await createUser(data)
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm">Sign up to get started</p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          {authError && (
            <div className="mb-4 flex items-center rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="text-sm">{authError}</span>
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
                {...register('email', {
                  required: 'Email is required',
                  validate: (email) =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                    'Invalid email address',
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
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 2,
                    message: 'Username must be at least 2 characters',
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
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters long',
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
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm">
            Already have an account?{' '}
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
  )
}

export default RouteComponent
