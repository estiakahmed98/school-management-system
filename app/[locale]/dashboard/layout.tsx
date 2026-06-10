'use client'

import React from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { sidebarConfig } from '@/lib/config/sidebar-config'

export default function DashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarLogo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
        SM
      </div>
      <div className="text-sm">
        <div className="font-bold text-foreground">School</div>
        <div className="text-xs text-muted-foreground">Management</div>
      </div>
    </div>
  )

  return (
    <DashboardLayout
      sidebarItems={sidebarConfig}
      logo={sidebarLogo}
      topbarLogo={sidebarLogo}
    >
      {children}
    </DashboardLayout>
  )
}
