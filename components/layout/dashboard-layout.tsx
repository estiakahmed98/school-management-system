'use client'

import { ReactNode, useState } from 'react'
import { AppSidebar, SidebarItemData } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import type { NotificationPreview } from '@/components/layout/topbar'

interface DashboardLayoutProps {
  children: ReactNode
  sidebarItems: SidebarItemData[]
  notificationCount?: number
  notifications?: NotificationPreview[]
}

export function DashboardLayout({
  children,
  sidebarItems,
  notificationCount = 0,
  notifications = [],
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const logo = (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">
        SM
      </div>
      <div className="text-sm">
        <div className="font-bold text-foreground">School</div>
        <div className="text-xs text-muted-foreground">Management</div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        items={sidebarItems}
        logo={logo}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          logo={logo}
          onMenuClick={() => setIsSidebarOpen(true)}
          notificationCount={notificationCount}
          notifications={notifications}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
