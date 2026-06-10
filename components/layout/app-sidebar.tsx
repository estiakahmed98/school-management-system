'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LucideIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import { useState } from 'react'

export interface SidebarItem {
  title: string
  href?: string
  icon: LucideIcon
  permission?: string
  children?: SidebarItem[]
}

interface AppSidebarProps {
  items: SidebarItem[]
  logo?: React.ReactNode
}

export function AppSidebar({ items, logo }: AppSidebarProps) {
  const pathname = usePathname()
  const { hasPermission } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    // Remove locale prefix for comparison
    const cleanPathname = pathname.replace(/^\/[a-z]{2}/, '')
    return cleanPathname.startsWith(href)
  }

  const isItemVisible = (item: SidebarItem) => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  const renderItem = (item: SidebarItem, depth = 0) => {
    if (!isItemVisible(item)) return null

    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpand(item.title)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
              isExpanded ? 'bg-sidebar-accent' : 'hover:bg-sidebar-accent/50'
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.title}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          {isExpanded && (
            <div className="ml-2 border-l border-sidebar-border">
              {(item.children ?? [])
                .filter(isItemVisible)
                .map(child => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.title}
        href={item.href || '#'}
        className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
          isActive(item.href)
            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
            : 'text-sidebar-foreground hover:bg-sidebar-accent'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.title}</span>
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen overflow-y-auto flex flex-col">
      {/* Logo */}
      {logo && <div className="p-6 border-b border-sidebar-border">{logo}</div>}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map(item => renderItem(item))}
      </nav>
    </aside>
  )
}
