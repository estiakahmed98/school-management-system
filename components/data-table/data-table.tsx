'use client'

import { Trash2, Edit2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ColumnConfig {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  width?: string
}

interface DataTableProps {
  columns: ColumnConfig[]
  data: any[]
  onView?: (row: any) => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  actions?: boolean
}

export function DataTable({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  actions = true,
}: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-sm font-semibold text-foreground"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="border-b border-border hover:bg-muted/50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 text-sm text-card-foreground" style={{ width: col.width }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(row)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(row)}
                        aria-label="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(row)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
