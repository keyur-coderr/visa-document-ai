"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";
import { ChevronRightIcon } from "@/components/ui/icons";

/** Breadcrumb trail derived from the current route and the shared nav config. */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "/dashboard";
  const segments = pathname.split("/").filter(Boolean);
  const activeItem = navItems.find((item) => item.href === `/${segments[0]}`);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
      <Link href="/dashboard" className="focus-ring rounded hover:text-neutral-800 dark:hover:text-neutral-200">
        Visa Document AI
      </Link>
      {activeItem ? (
        <>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="font-medium text-neutral-800 dark:text-neutral-200">{activeItem.label}</span>
        </>
      ) : null}
    </nav>
  );
}
