import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Enter your credentials to access your firm's cases.
      </p>

      <form className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <FormInput id="email" type="email" autoComplete="email" placeholder="you@firm.com" />
        </FormField>
        <FormField>
          <div className="flex items-center justify-between">
            <FormLabel htmlFor="password">Password</FormLabel>
            <Link href="/forgot-password" className="focus-ring rounded text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <FormInput id="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        </FormField>
        <Button type="button" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-400">
        Authentication is not yet connected — this is a Phase 1 UI placeholder.
      </p>
    </div>
  );
}
