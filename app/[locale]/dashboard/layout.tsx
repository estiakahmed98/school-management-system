import React from 'react'
import { auth } from '@/auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { sidebarConfig } from '@/lib/config/sidebar-config'
import { redirect } from 'next/navigation'

export default async function DashLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}/login?redirect=/${locale}/dashboard`)
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarConfig}
    >
      {children}
    </DashboardLayout>
  )
}
