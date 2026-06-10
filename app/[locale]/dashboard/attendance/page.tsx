'use client'

import { useEffect, useState } from 'react'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Attendance } from '@/lib/mock-data'

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance')
      const data = await res.json()
      if (data.success) {
        setAttendance(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: Attendance) => {
    console.log('Edit attendance:', item)
  }

  const handleDelete = async (item: Attendance) => {
    if (confirm('Delete attendance record?')) {
      try {
        await fetch(`/api/attendance/${item.id}`, { method: 'DELETE' })
        fetchAttendance()
      } catch (err) {
        console.error('Failed to delete attendance:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'present' ? 'bg-green-100 text-green-700' :
          value === 'absent' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {value}
        </span>
      ),
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.ATTENDANCE_VIEW}>
      <CrudPageLayout
        title="Attendance Management"
        columns={columns}
        data={attendance}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PermissionGuard>
  )
}
