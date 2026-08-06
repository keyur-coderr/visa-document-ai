import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Forgot password</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <FormInput id="email" type="email" autoComplete="email" placeholder="you@firm.com" />
        </FormField>
        <Button type="button" className="w-full">
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
