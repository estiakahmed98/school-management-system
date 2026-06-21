'use client'

import { ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  logo?: ReactNode
  onMenuClick: () => void
}

export function Topbar({ logo, onMenuClick }: TopbarProps) {
  const { user } = useAuth()
  const locale = useLocale()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    router.replace(`/${locale}/login`)
    router.refresh()
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        {logo && <div className="flex items-center">{logo}</div>}
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <p className="font-semibold text-foreground">{user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
