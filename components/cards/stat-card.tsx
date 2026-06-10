'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export function StatCard({ label, value, icon: Icon, color = 'primary' }: StatCardProps) {
  const bgColorMap = {
    primary: 'bg-primary/10',
    success: 'bg-[var(--success)]/10',
    warning: 'bg-[var(--warning)]/10',
    danger: 'bg-[var(--danger)]/10',
    info: 'bg-[var(--info)]/10',
  }

  const iconColorMap = {
    primary: 'text-primary',
    success: 'text-[var(--success)]',
    warning: 'text-[var(--warning)]',
    danger: 'text-[var(--danger)]',
    info: 'text-[var(--info)]',
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold text-card-foreground mt-2">{value}</p>
        </div>
        {Icon && (
          <div className={`${bgColorMap[color]} rounded-lg p-3`}>
            <Icon className={`h-6 w-6 ${iconColorMap[color]}`} />
          </div>
        )}
      </div>
    </div>
  )
}
