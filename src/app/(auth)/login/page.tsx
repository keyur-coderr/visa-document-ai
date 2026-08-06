import Link from "next/link";
import { signInWithMagicLinkAction, signInWithPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

interface LoginPageProps {
  searchParams?: {
    error?: string;
    status?: string;
  };
}

function statusMessage(status?: string): string | null {
  if (!status) return null;
  if (status === "magic_link_sent") return "Magic link sent. Check your email inbox.";
  if (status === "password_reset_success") return "Password reset complete. Please sign in.";
  if (status === "password_reset_mock") return "Mock mode: password reset simulated.";
  return null;
}

function errorMessage(error?: string): string | null {
  if (!error) return null;
  if (error === "invalid_credentials") return "Enter a valid email and password (8+ characters).";
  if (error === "signin_failed") return "Sign in failed. Verify credentials and try again.";
  if (error === "magic_link_failed") return "Unable to send magic link right now.";
  if (error === "supabase_not_configured") return "Supabase is not configured. Running in mock mode.";
  if (error === "invalid_email") return "Enter a valid email address.";
  return "Authentication request failed.";
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const status = statusMessage(searchParams?.status);
  const error = errorMessage(searchParams?.error);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Enter your credentials to access your firm's cases.
      </p>

      {status ? <p className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-700 dark:bg-success-500/10 dark:text-success-500">{status}</p> : null}
      {error ? <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">{error}</p> : null}

      <form action={signInWithPasswordAction} className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <FormInput id="email" name="email" type="email" autoComplete="email" placeholder="you@firm.com" required />
        </FormField>
        <FormField>
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="password">Password</FormLabel>
            <Link href="/forgot-password" className="focus-ring rounded text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <FormInput id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
        </FormField>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <form action={signInWithMagicLinkAction} className="mt-3 space-y-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Magic link sign-in</p>
        <FormField>
          <FormLabel htmlFor="magic-email">Email address</FormLabel>
          <FormInput id="magic-email" name="email" type="email" autoComplete="email" placeholder="you@firm.com" required />
        </FormField>
        <Button type="submit" variant="secondary" className="w-full">
          Send Magic Link
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        New practitioner? <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">Create account</Link>
      </p>

      <p className="mt-6 text-center text-xs text-neutral-400">
        MFA enforcement is a future setup step and is not fully enabled yet.
      </p>
    </div>
  );
}
