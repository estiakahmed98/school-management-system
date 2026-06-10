'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Student } from '@/lib/mock-data'

export default function StudentsPage() {
  const t = useTranslations()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      if (data.success) {
        setStudents(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student: Student) => {
    console.log('Edit student:', student)
    // TODO: Implement edit modal
  }

  const handleDelete = async (student: Student) => {
    if (confirm(`Delete ${student.name}?`)) {
      try {
        await fetch(`/api/students/${student.id}`, { method: 'DELETE' })
        fetchStudents()
      } catch (err) {
        console.error('Failed to delete student:', err)
      }
    }
  }

  const handleAdd = () => {
    console.log('Add student')
    // TODO: Implement add modal
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: t('students.name') },
    { key: 'rollNumber', label: t('students.rollNumber') },
    { key: 'class', label: t('students.class') },
    { key: 'section', label: t('students.section') },
    { key: 'parentName', label: t('students.parentName') },
    { key: 'email', label: t('students.email') },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.STUDENT_VIEW}>
      <CrudPageLayout
        title={t('students.title')}
        columns={columns}
        data={students}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel={t('students.addStudent')}
      />
    </PermissionGuard>
  )
}
