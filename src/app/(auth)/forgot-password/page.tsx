import Link from "next/link";
import { sendPasswordResetAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

interface ForgotPasswordPageProps {
  searchParams?: {
    error?: string;
    status?: string;
  };
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Forgot password</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {searchParams?.status === "reset_link_sent" ? (
        <p className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-700 dark:bg-success-500/10 dark:text-success-500">Reset link sent if this account exists.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">Unable to send reset link.</p>
      ) : null}

      <form action={sendPasswordResetAction} className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <FormInput id="email" name="email" type="email" autoComplete="email" placeholder="you@firm.com" required />
        </FormField>
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="focus-ring rounded font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
