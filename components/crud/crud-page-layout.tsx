'use client'

import { ReactNode, useState } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { DataTable, ColumnConfig } from '@/components/data-table/data-table'
import { Search } from 'lucide-react'

interface CrudPageLayoutProps {
  title: string
  description?: string
  columns: ColumnConfig[]
  data: any[]
  onAdd?: () => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  searchable?: boolean
  searchPlaceholder?: string
  addButtonLabel?: string
}

export function CrudPageLayout({
  title,
  description,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  searchable = true,
  searchPlaceholder = 'Search...',
  addButtonLabel = 'Add New',
}: CrudPageLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredData = searchable
    ? data.filter(item =>
        columns.some(col => {
          const value = item[col.key]?.toString().toLowerCase() || ''
          return value.includes(searchTerm.toLowerCase())
        })
      )
    : data

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={onAdd && <Button onClick={onAdd}>{addButtonLabel}</Button>}
      />

      {searchable && (
        <div className="mb-6 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
      )}

      <DataTable columns={columns} data={filteredData} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
