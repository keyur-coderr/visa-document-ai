import Link from "next/link";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

interface ResetPasswordPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Reset password</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose a new password for your account.</p>

      {searchParams?.error ? (
        <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">Password reset failed. Ensure passwords match and are at least 8 characters.</p>
      ) : null}

      <form action={resetPasswordAction} className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="password">New password</FormLabel>
          <FormInput id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" required />
        </FormField>
        <FormField>
          <FormLabel htmlFor="confirm-password">Confirm new password</FormLabel>
          <FormInput id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" required />
        </FormField>
        <Button type="submit" className="w-full">
          Reset password
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
