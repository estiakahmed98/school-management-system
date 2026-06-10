'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Teacher } from '@/lib/mock-data'

export default function TeachersPage() {
  const t = useTranslations()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers')
      const data = await res.json()
      if (data.success) {
        setTeachers(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (teacher: Teacher) => {
    console.log('Edit teacher:', teacher)
  }

  const handleDelete = async (teacher: Teacher) => {
    if (confirm(`Delete ${teacher.name}?`)) {
      try {
        await fetch(`/api/teachers/${teacher.id}`, { method: 'DELETE' })
        fetchTeachers()
      } catch (err) {
        console.error('Failed to delete teacher:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: t('teachers.name') },
    { key: 'subject', label: t('teachers.subject') },
    { key: 'qualification', label: t('teachers.qualification') },
    { key: 'email', label: t('teachers.email') },
    { key: 'joinDate', label: 'Join Date' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.TEACHER_VIEW}>
      <CrudPageLayout
        title={t('teachers.title')}
        columns={columns}
        data={teachers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel={t('teachers.addTeacher')}
      />
    </PermissionGuard>
  )
}
