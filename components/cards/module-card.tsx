'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface ModuleCardProps {
  title: string
  description?: string
  href: string
  icon: LucideIcon
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary'
}

export function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
  color = 'primary',
}: ModuleCardProps) {
  const colorMap = {
    success: 'bg-[var(--success)]',
    warning: 'bg-[var(--warning)]',
    danger: 'bg-[var(--danger)]',
    info: 'bg-[var(--info)]',
    primary: 'bg-primary',
  }

  return (
    <Link href={href}>
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-lg transition-shadow cursor-pointer h-full hover:scale-105 transform transition-transform">
        <div className={`${colorMap[color]} rounded-lg p-3 w-fit mb-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
      </div>
    </Link>
  )
}
