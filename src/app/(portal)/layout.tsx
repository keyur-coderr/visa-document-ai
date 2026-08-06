import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session.isAuthenticated) redirect("/portal/login");
  if (session.role !== "client") redirect("/dashboard");
  return <div className="min-h-screen bg-neutral-50 text-neutral-900"><header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/portal" className="font-semibold text-brand-700">Visa Document AI</Link><a href="/auth/logout" className="text-sm font-medium text-neutral-600 hover:text-neutral-900">Sign out</a></div></header><main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main></div>;
}