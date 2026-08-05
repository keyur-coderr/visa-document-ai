export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          VD
        </span>
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Visa Document AI</span>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-panel dark:border-neutral-800 dark:bg-neutral-900">
        {children}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-neutral-400 dark:text-neutral-500">
        Visa Document AI is documentation software for licensed immigration professionals. It is not a law firm and
        does not provide legal advice.
      </p>
    </div>
  );
}
