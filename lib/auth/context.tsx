'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import type { AuthContextType, User } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const user = (session?.user as User | undefined) ?? null
  const isLoading = status === 'loading'

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.permissions.includes('*')) return true
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false
    if (user.permissions.includes('*')) return true
    return permissions.some(p => user.permissions.includes(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false
    if (user.permissions.includes('*')) return true
    return permissions.every(p => user.permissions.includes(p))
  }

  const value: AuthContextType = {
    user,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
