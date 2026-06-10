'use client'

import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import { Badge } from '@/components/ui/badge'

export default function PermissionsPage() {
  const permissionsList = Object.values(PERMISSIONS)

  // Group permissions by module
  const groupedPermissions = permissionsList.reduce(
    (acc, perm) => {
      const module = perm.split('.')[0]
      if (!acc[module]) acc[module] = []
      acc[module].push(perm)
      return acc
    },
    {} as Record<string, string[]>
  )

  return (
    <PermissionGuard permission={PERMISSIONS.SETTINGS_PERMISSIONS}>
      <div>
        <PageHeader title="Permission Management" description="Manage system permissions" />

        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <div key={module} className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 capitalize">{module}</h3>
              <div className="flex flex-wrap gap-2">
                {perms.map((perm, idx) => (
                  <Badge key={idx} variant="outline">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGuard>
  )
}
