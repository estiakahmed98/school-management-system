'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const initializeTheme = async () => {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      try {
        const response = await fetch('/api/theme-settings')
        const payload = await response.json()

        if (payload.success) {
          applyThemeVariables(payload.data as Record<string, string>)
          const databaseTheme = payload.data.mode === 'dark' ? 'dark' : 'light'
          const initialTheme = savedTheme || databaseTheme || (prefersDark ? 'dark' : 'light')
          setThemeState(initialTheme)
          applyTheme(initialTheme)
          setMounted(true)
          return
        }
      } catch (error) {
        console.error('Failed to load theme settings', error)
      }

      const fallbackTheme = savedTheme || (prefersDark ? 'dark' : 'light')
      setThemeState(fallbackTheme)
      applyTheme(fallbackTheme)
      setMounted(true)
    }

    void initializeTheme()
  }, [])

  const applyThemeVariables = (settings: Record<string, string>) => {
    const htmlElement = document.documentElement
    htmlElement.style.setProperty('--primary', settings.primary)
    htmlElement.style.setProperty('--primary-foreground', settings.primaryForeground)
    htmlElement.style.setProperty('--secondary', settings.secondary)
    htmlElement.style.setProperty('--secondary-foreground', settings.secondaryForeground)
    htmlElement.style.setProperty('--accent', settings.accent)
    htmlElement.style.setProperty('--accent-foreground', settings.accentForeground)
    htmlElement.style.setProperty('--sidebar-primary', settings.sidebarPrimary)
    htmlElement.style.setProperty('--sidebar-primary-foreground', settings.sidebarPrimaryForeground)
  }

  const applyTheme = (newTheme: Theme) => {
    const htmlElement = document.documentElement
    if (newTheme === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  const value: ThemeContextType = { theme, toggleTheme, setTheme }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
