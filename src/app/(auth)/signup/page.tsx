import Link from "next/link";
import { signUpPractitionerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";
import { FormField, FormInput, FormLabel } from "@/components/ui/Form";

interface SignupPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Create practitioner account</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Set up your firm workspace and sign in.</p>

      {searchParams?.error ? (
        <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-500/10 dark:text-danger-500">
          Signup failed. Verify your details and try again.
        </p>
      ) : null}

      <form action={signUpPractitionerAction} className="mt-6 space-y-4">
        <FormField>
          <FormLabel htmlFor="full-name">Full name</FormLabel>
          <FormInput id="full-name" name="fullName" type="text" autoComplete="name" required />
        </FormField>
        <FormField>
          <FormLabel htmlFor="firm-name">Firm name</FormLabel>
          <FormInput id="firm-name" name="firmName" type="text" required />
        </FormField>
        <FormField>
          <FormLabel htmlFor="email">Email address</FormLabel>
          <FormInput id="email" name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField>
          <FormLabel htmlFor="password">Password</FormLabel>
          <FormInput id="password" name="password" type="password" autoComplete="new-password" required />
        </FormField>
        <Button type="submit" className="w-full">
          Create Account
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
