import React from 'react'
import { auth } from '@/auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { sidebarConfig } from '@/lib/config/sidebar-config'
import { prisma } from '@/lib/prisma'
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

  const [notificationCount, notifications] = await Promise.all([
    prisma.smsLog.count({
      where: {
        status: {
          in: ['queued', 'failed'],
        },
      },
    }),
    prisma.smsLog.findMany({
      where: {
        status: {
          in: ['queued', 'failed'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <DashboardLayout
      sidebarItems={sidebarConfig}
      notificationCount={notificationCount}
      notifications={notifications.map(item => ({
        id: item.id,
        title: `${item.type} SMS to ${item.receiver}`,
        subtitle: item.message,
        timestamp: item.createdAt.toLocaleString('en-BD', {
          day: '2-digit',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        }),
      }))}
    >
      {children}
    </DashboardLayout>
  )
}
