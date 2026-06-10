'use client'

import { useEffect, useState } from 'react'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Staff } from '@/lib/mock-data'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (data.success) {
        setStaff(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: Staff) => {
    console.log('Edit staff:', item)
  }

  const handleDelete = async (item: Staff) => {
    if (confirm(`Delete ${item.name}?`)) {
      try {
        await fetch(`/api/staff/${item.id}`, { method: 'DELETE' })
        fetchStaff()
      } catch (err) {
        console.error('Failed to delete staff:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Name' },
    { key: 'position', label: 'Position' },
    { key: 'department', label: 'Department' },
    { key: 'email', label: 'Email' },
    { key: 'joinDate', label: 'Join Date' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.STAFF_VIEW}>
      <CrudPageLayout
        title="Staff Management"
        columns={columns}
        data={staff}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PermissionGuard>
  )
}
