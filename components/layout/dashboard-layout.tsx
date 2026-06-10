'use client'

import { ReactNode } from 'react'
import { AppSidebar, SidebarItem } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'

interface DashboardLayoutProps {
  children: ReactNode
  sidebarItems: SidebarItem[]
  logo?: ReactNode
  topbarLogo?: ReactNode
}

export function DashboardLayout({
  children,
  sidebarItems,
  logo,
  topbarLogo,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar items={sidebarItems} logo={logo} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar logo={topbarLogo} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
