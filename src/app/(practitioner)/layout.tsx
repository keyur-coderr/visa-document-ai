import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getAuthSession } from "@/server/auth/session";

export default async function PractitionerLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session.isAuthenticated) {
    redirect("/login");
  }
  if (session.role === "client") {
    redirect("/portal");
  }

  return <AppShell>{children}</AppShell>;
}
