"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MenuIcon } from "@/components/ui/icons";

export interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="focus-ring rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsPanel />
        <UserMenu />
      </div>
    </header>
  );
}
