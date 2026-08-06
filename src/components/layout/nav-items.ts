import type { ComponentType, SVGProps } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FolderOpen,
  Bot,
  ListChecks,
  LineChart,
  BarChart3,
  UsersRound,
  CreditCard,
  Settings,
  ShieldQuestion,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}

/** Primary practitioner-app navigation. Shared by Sidebar and Breadcrumbs. */
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Firm-wide overview and activity" },
  { label: "Cases", href: "/cases", icon: Briefcase, description: "Manage immigration case files" },
  { label: "Clients", href: "/clients", icon: Users, description: "Client records and contact details" },
  { label: "Documents", href: "/documents", icon: FolderOpen, description: "Uploaded documents across all cases" },
  { label: "AI Processing", href: "/ai-review", icon: Bot, description: "Human review queue for AI-generated output" },
  { label: "Tasks", href: "/dashboard#tasks", icon: ListChecks, description: "Case and workflow tasks" },
  { label: "Analytics", href: "/reports#analytics", icon: LineChart, description: "KPI and workflow analytics" },
  { label: "Reports", href: "/reports", icon: BarChart3, description: "Operational and compliance reporting" },
  { label: "Team", href: "/admin#team", icon: UsersRound, description: "Team structure and permissions" },
  { label: "Billing", href: "/settings#billing", icon: CreditCard, description: "Plans, usage, and invoices" },
  { label: "Settings", href: "/settings", icon: Settings, description: "Firm and account preferences" },
  { label: "Admin", href: "/admin", icon: ShieldQuestion, description: "Firm administration and governance" },
];
