'use client'

import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import { ROLE_PERMISSIONS } from '@/lib/auth/constants'
import { Badge } from '@/components/ui/badge'

export default function RolesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.SETTINGS_ROLES}>
      <div>
        <PageHeader title="Role Management" description="Manage system roles and permissions" />

        <div className="space-y-4">
          {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
            <div key={role} className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">{role}</h3>
              <div className="flex flex-wrap gap-2">
                {permissions.map((perm, idx) => (
                  <Badge key={idx} variant="secondary">
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
