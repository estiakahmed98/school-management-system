"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Bus,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  LayoutGrid,
  LucideIcon,
  MessageSquare,
  Package,
  ReceiptText,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const sidebarIcons = {
  layoutGrid: LayoutGrid,
  users: Users,
  bookOpen: BookOpen,
  fileText: FileText,
  dollarSign: DollarSign,
  package: Package,
  bus: Bus,
  messageSquare: MessageSquare,
  settings: Settings,
  barChart3: BarChart3,
  calendar: Calendar,
  graduationCap: GraduationCap,
  home: Home,
  clock: Clock,
  receiptText: ReceiptText,
  briefcase: Briefcase,
} as const;

export type SidebarIconKey = keyof typeof sidebarIcons;

export interface SidebarItemData {
  title: string;
  href?: string;
  icon: SidebarIconKey;
  permission?: string;
  children?: SidebarItemData[];
}

interface AppSidebarProps {
  items: SidebarItemData[];
  logo?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ items, logo, isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const cleanPathname = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") {
      return cleanPathname === href;
    }

    return cleanPathname === href || cleanPathname.startsWith(`${href}/`);
  };

  const hasActiveDescendant = (item: SidebarItemData): boolean => {
    if (isActive(item.href)) {
      return true;
    }

    return (item.children ?? []).some((child) => hasActiveDescendant(child));
  };

  const isItemVisible = (item: SidebarItemData) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  };

  const renderItem = (item: SidebarItemData) => {
    if (!isItemVisible(item)) return null;

    const Icon: LucideIcon = sidebarIcons[item.icon];
    const hasChildren = item.children && item.children.length > 0;
    const isCurrentSection = hasActiveDescendant(item);
    const isExpanded = expandedItems.includes(item.title) || isCurrentSection;

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpand(item.title)}
            className={`group w-full flex items-center gap-3 rounded-lg border px-4 py-2 text-sm transition-colors ${
              isCurrentSection
                ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground ring-1 ring-sidebar-primary/20 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-100"
                : isExpanded
                  ? "border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground dark:bg-sidebar-accent/35"
                  : "border-transparent text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent/30"
            }`}
          >
            <span
              className={`h-5 w-1 rounded-full transition-colors ${
                isCurrentSection
                  ? "bg-sidebar-primary-foreground"
                  : isExpanded
                    ? "bg-sidebar-foreground/40"
                    : "bg-transparent group-hover:bg-sidebar-foreground/25"
              }`}
            />
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
          {isExpanded && (
            <div className="ml-2 border-l border-sidebar-border">
              {(item.children ?? [])
                .filter(isItemVisible)
                .map((child) => renderItem(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href || "#"}
        onClick={onClose}
        className={`group flex items-center gap-3 rounded-lg border px-4 py-2 text-sm transition-colors ${
          isActive(item.href)
            ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground font-medium ring-1 ring-sidebar-primary/20 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-100"
            : "border-transparent text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent/50 dark:hover:bg-sidebar-accent/30"
        }`}
      >
        <span
          className={`h-5 w-1 rounded-full transition-colors ${
            isActive(item.href)
              ? "bg-sidebar-primary-foreground"
              : "bg-transparent group-hover:bg-sidebar-foreground/25"
          }`}
        />
        <Icon className="h-5 w-5 shrink-0" />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar transition-transform md:static md:z-auto md:w-64 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-6 md:block">
          {logo}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {items.map((item) => renderItem(item))}
        </nav>
      </aside>
    </>
  );
}
