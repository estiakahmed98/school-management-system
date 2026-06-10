'use client'

import { useEffect, useState } from 'react'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Fee } from '@/lib/mock-data'

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    try {
      const res = await fetch('/api/fees')
      const data = await res.json()
      if (data.success) {
        setFees(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch fees:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (fee: Fee) => {
    console.log('Edit fee:', fee)
  }

  const handleDelete = async (fee: Fee) => {
    if (confirm(`Delete fee record?`)) {
      try {
        await fetch(`/api/fees/${fee.id}`, { method: 'DELETE' })
        fetchFees()
      } catch (err) {
        console.error('Failed to delete fee:', err)
      }
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'month', label: 'Month' },
    { key: 'amount', label: 'Amount' },
    { key: 'dueDate', label: 'Due Date' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {value}
        </span>
      ),
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.FEE_VIEW}>
      <CrudPageLayout
        title="Fee Management"
        columns={columns}
        data={fees}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </PermissionGuard>
  )
}
