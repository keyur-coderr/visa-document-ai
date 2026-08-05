/**
 * Session placeholder — represents the "checking your session" transition
 * screen a real Supabase Auth session check will occupy in Phase 4.
 */
export default function SessionPage() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden="true" />
      <h1 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">Checking your session…</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        This is a placeholder screen. Session validation is wired up when Supabase Auth is integrated.
      </p>
    </div>
  );
}
