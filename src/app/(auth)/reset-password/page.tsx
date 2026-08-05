import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Reset password</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Choose a new password for your account.</p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="focus-ring mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="focus-ring mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <button
          type="button"
          className="focus-ring w-full rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Reset password
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="focus-ring rounded font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
