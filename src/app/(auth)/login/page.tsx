import Link from "next/link";

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Enter your credentials to access your firm's cases.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@firm.com"
            className="focus-ring mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Password
            </label>
            <Link href="/forgot-password" className="focus-ring rounded text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="focus-ring mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
        <button
          type="button"
          className="focus-ring w-full rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-400">
        Authentication is not yet connected — this is a Phase 1 UI placeholder.
      </p>
    </div>
  );
}
