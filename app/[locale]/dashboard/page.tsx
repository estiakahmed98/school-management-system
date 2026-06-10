'use client'

import { useEffect, useState } from 'react'
import { Users, BookOpen, DollarSign, BookMarked } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { StatCard } from '@/components/cards/stat-card'
import { ModuleCard } from '@/components/cards/module-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingState } from '@/components/states/loading-state'
import { useAuth } from '@/lib/auth/context'

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalStaff: number
  totalClasses: number
  totalFeesPending: number
  totalFeesAmount: number
  activeStudents: number
}

export default function DashboardPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard')
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title={`${t('dashboard.welcome')}, ${user?.name}!`}
        description="Here's your school management overview"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label={t('dashboard.totalStudents')}
          value={stats?.totalStudents || 0}
          icon={Users}
          color="success"
        />
        <StatCard
          label={t('dashboard.totalTeachers')}
          value={stats?.totalTeachers || 0}
          icon={Users}
          color="info"
        />
        <StatCard
          label={t('dashboard.totalStaff')}
          value={stats?.totalStaff || 0}
          icon={BookOpen}
          color="warning"
        />
        <StatCard
          label={t('dashboard.totalClasses')}
          value={stats?.totalClasses || 0}
          icon={BookMarked}
          color="danger"
        />
      </div>

      {/* Module Cards */}
      <h2 className="text-xl font-semibold mb-4 text-foreground">{t('dashboard.quickLinks')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModuleCard
          title={t('navigation.students')}
          description="Manage student information"
          href="/dashboard/students"
          icon={Users}
          color="success"
        />
        <ModuleCard
          title={t('navigation.teachers')}
          description="Manage teacher details"
          href="/dashboard/teachers"
          icon={Users}
          color="info"
        />
        <ModuleCard
          title={t('navigation.attendance')}
          description="Track attendance records"
          href="/dashboard/attendance"
          icon={Users}
          color="warning"
        />
        <ModuleCard
          title={t('navigation.exams')}
          description="Manage exams and schedules"
          href="/dashboard/exams"
          icon={BookOpen}
          color="danger"
        />
        <ModuleCard
          title={t('navigation.fees')}
          description="Track fee collections"
          href="/dashboard/fees"
          icon={DollarSign}
          color="success"
        />
        <ModuleCard
          title={t('navigation.classes')}
          description="Manage classes"
          href="/dashboard/classes"
          icon={BookMarked}
          color="info"
        />
        <ModuleCard
          title={t('navigation.staff')}
          description="Manage staff members"
          href="/dashboard/staff"
          icon={Users}
          color="warning"
        />
        <ModuleCard
          title={t('navigation.settings')}
          description="System settings"
          href="/dashboard/settings/roles"
          icon={BookOpen}
          color="danger"
        />
      </div>
    </div>
  )
}
