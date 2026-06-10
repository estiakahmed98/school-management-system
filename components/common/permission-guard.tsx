'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth/context'

interface PermissionGuardProps {
  permission?: string | string[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { user, isLoading, hasPermission, hasAllPermissions, hasAnyPermission } = useAuth()

  if (isLoading) return null

  if (!user) return fallback

  if (!permission) return children

  let hasAccess = false

  if (typeof permission === 'string') {
    hasAccess = hasPermission(permission)
  } else if (Array.isArray(permission)) {
    hasAccess = requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission)
  }

  return hasAccess ? children : fallback
}
