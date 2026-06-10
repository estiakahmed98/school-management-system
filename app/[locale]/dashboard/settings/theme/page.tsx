'use client'

import { PageHeader } from '@/components/common/page-header'
import { useTheme } from '@/lib/theme/context'
import { Button } from '@/components/ui/button'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'

export default function ThemeSettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <PermissionGuard permission={PERMISSIONS.SETTINGS_THEME}>
      <div>
        <PageHeader title="Theme Settings" description="Customize application appearance" />

        <div className="bg-card border border-border rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-foreground mb-4">Theme Preference</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-foreground">Current Theme: <span className="font-semibold capitalize">{theme}</span></span>
            </div>
            
            <Button onClick={toggleTheme} className="w-full">
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Your theme preference is automatically saved and applied across the application.
          </p>
        </div>
      </div>
    </PermissionGuard>
  )
}
