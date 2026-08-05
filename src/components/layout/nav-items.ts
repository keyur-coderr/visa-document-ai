import type { ComponentType, SVGProps } from "react";
import {
  DashboardIcon,
  CasesIcon,
  ClientsIcon,
  DocumentsIcon,
  AiReviewIcon,
  ReportsIcon,
  SettingsIcon,
  AdminIcon,
} from "@/components/ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}

/** Primary practitioner-app navigation. Shared by Sidebar and Breadcrumbs. */
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon, description: "Firm-wide overview and activity" },
  { label: "Cases", href: "/cases", icon: CasesIcon, description: "Manage immigration case files" },
  { label: "Clients", href: "/clients", icon: ClientsIcon, description: "Client records and contact details" },
  { label: "Documents", href: "/documents", icon: DocumentsIcon, description: "Uploaded documents across all cases" },
  { label: "AI Review", href: "/ai-review", icon: AiReviewIcon, description: "Human review queue for AI-generated output" },
  { label: "Reports", href: "/reports", icon: ReportsIcon, description: "Operational and compliance reporting" },
  { label: "Settings", href: "/settings", icon: SettingsIcon, description: "Firm and account preferences" },
  { label: "Admin", href: "/admin", icon: AdminIcon, description: "Firm administration and team management" },
];
