"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { Bell, ChevronRight, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NotificationPreview {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

interface TopbarProps {
  logo?: ReactNode;
  onMenuClick: () => void;
  notificationCount?: number;
  notifications?: NotificationPreview[];
}

export function Topbar({
  logo,
  onMenuClick,
  notificationCount = 0,
  notifications = [],
}: TopbarProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace(`/${locale}/login`);
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-end px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="relative" ref={notificationRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={`${notificationCount} unread SMS notifications`}
            onClick={() => setIsNotificationOpen((current) => !current)}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-5 text-primary-foreground">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            ) : null}
          </Button>

          {isNotificationOpen ? (
            <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      SMS notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notificationCount > 0
                        ? `${notificationCount} items need attention`
                        : "No pending notifications"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">
                    No unread SMS notifications.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        router.push(`/${locale}/dashboard/sms`);
                      }}
                      className="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-muted/60 last:border-b-0"
                    >
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-border px-4 py-3">
                <Link
                  href={`/${locale}/dashboard/sms`}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted",
                  )}
                  onClick={() => setIsNotificationOpen(false)}
                >
                  Open SMS center
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
