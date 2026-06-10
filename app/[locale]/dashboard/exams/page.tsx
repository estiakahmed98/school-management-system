'use client'

import { useEffect, useState } from 'react'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Exam } from '@/lib/mock-data'

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      if (data.success) {
        setExams(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (exam: Exam) => {
    console.log('Edit exam:', exam)
  }

  const handleDelete = async (exam: Exam) => {
    if (confirm(`Delete ${exam.name}?`)) {
      try {
        await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
        fetchExams()
      } catch (err) {
        console.error('Failed to delete exam:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Exam Name' },
    { key: 'class', label: 'Class' },
    { key: 'subject', label: 'Subject' },
    { key: 'date', label: 'Date' },
    { key: 'totalMarks', label: 'Total Marks' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.EXAM_VIEW}>
      <CrudPageLayout
        title="Exam Management"
        columns={columns}
        data={exams}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PermissionGuard>
  )
}
