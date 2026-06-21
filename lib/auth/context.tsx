'use client'

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import type { AuthContextType, User } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (!isMounted) {
          return
        }

        if (!response.ok) {
          setUser(null)
          return
        }

        const payload = await response.json()
        setUser(payload?.data ?? null)
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

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
