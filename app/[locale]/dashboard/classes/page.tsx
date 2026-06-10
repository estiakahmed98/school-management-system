'use client'

import { useEffect, useState } from 'react'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Class } from '@/lib/mock-data'

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes')
      const data = await res.json()
      if (data.success) {
        setClasses(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: Class) => {
    console.log('Edit class:', item)
  }

  const handleDelete = async (item: Class) => {
    if (confirm(`Delete ${item.name}?`)) {
      try {
        await fetch(`/api/classes/${item.id}`, { method: 'DELETE' })
        fetchClasses()
      } catch (err) {
        console.error('Failed to delete class:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Class Name' },
    { key: 'section', label: 'Section' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'room', label: 'Room' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.CLASS_VIEW}>
      <CrudPageLayout
        title="Class Management"
        columns={columns}
        data={classes}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PermissionGuard>
  )
}
