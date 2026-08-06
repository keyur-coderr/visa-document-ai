"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";
import { CircleHelp, Menu } from "lucide-react";
import { ChevronDownIcon } from "@/components/ui/icons";

export interface HeaderProps {
  desktopSidebarCollapsed: boolean;
  onToggleDesktopSidebar: () => void;
  onMenuClick: () => void;
}

export function Header({ desktopSidebarCollapsed, onToggleDesktopSidebar, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center gap-2 border-b border-[color:var(--color-border)] bg-white px-4 supports-[backdrop-filter]:bg-white/95 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="focus-ring rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={onToggleDesktopSidebar}
        aria-label={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="focus-ring hidden rounded-lg p-2 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-subtle)] lg:inline-flex"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <div className="hidden min-w-0 flex-1 items-center gap-5 lg:flex">
        <Breadcrumbs />
        <SearchInput
          aria-label="Global search"
          placeholder="Search cases, clients, docs"
          className="h-9"
          containerClassName="w-full max-w-[24rem]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Dropdown
          trigger={<span className="focus-ring hidden h-9 items-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-white px-3 text-sm font-medium text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-subtle)] 2xl:inline-flex">Default Workspace</span>}
          items={[
            { id: "workspace-default", label: "Default Workspace", onSelect: () => undefined },
            { id: "workspace-enterprise", label: "Enterprise Workspace", onSelect: () => undefined },
          ]}
        />
        <Dropdown
          trigger={<span className="focus-ring inline-flex h-9 min-w-[112px] items-center justify-center gap-1.5 rounded-[14px] bg-brand-600 px-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md">New Case <ChevronDownIcon className="h-3.5 w-3.5" /></span>}
          items={[
            { id: "qa-new-case", label: "Create New Case", onSelect: () => undefined },
            { id: "qa-upload-doc", label: "Upload Documents", onSelect: () => undefined },
            { id: "qa-review", label: "Run AI Review", onSelect: () => undefined },
            { id: "qa-client", label: "Create Client", onSelect: () => undefined },
          ]}
        />
        <span className="mx-1 hidden h-6 w-px bg-[color:var(--color-border)] lg:block" aria-hidden="true" />
        <IconButton aria-label="Help" variant="ghost" size="md">
          <CircleHelp className="h-5 w-5" />
        </IconButton>
        <div className="hidden xl:block">
          <ThemeToggle />
        </div>
        <NotificationsPanel />
        <UserMenu />
      </div>
    </header>
  );
}
