import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Reset password</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose a new password for your account.</p>

      <form className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="password">New password</FormLabel>
          <FormInput id="password" type="password" autoComplete="new-password" placeholder="••••••••" />
        </FormField>
        <FormField>
          <FormLabel htmlFor="confirm-password">Confirm new password</FormLabel>
          <FormInput id="confirm-password" type="password" autoComplete="new-password" placeholder="••••••••" />
        </FormField>
        <Button type="button" className="w-full">
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
