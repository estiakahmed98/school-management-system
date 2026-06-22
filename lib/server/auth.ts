import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/server/api'
import { PERMISSIONS } from '@/lib/auth/constants'

const ADMISSION_PERMISSIONS = [
  PERMISSIONS.ADMISSION_VIEW,
  PERMISSIONS.ADMISSION_CREATE,
  PERMISSIONS.ADMISSION_EDIT,
  PERMISSIONS.ADMISSION_DELETE,
]

async function syncAdmissionPermissions() {
  const permissionEntries = ADMISSION_PERMISSIONS.map(permission => {
    const [module, action] = permission.split('.', 2)
    return { permission, module, action }
  })

  const roles = await prisma.role.findMany({
    where: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    select: { id: true, name: true },
  })

  for (const { permission, module, action } of permissionEntries) {
    const permissionRecord = await prisma.permission.upsert({
      where: { name: permission },
      update: {
        module,
        action,
      },
      create: {
        name: permission,
        module,
        action,
        description: `${module} ${action}`,
      },
    })

    for (const role of roles) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionRecord.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionRecord.id,
        },
      })
    }
  }
}

export async function getUserByEmail(email: string) {
  await syncAdmissionPermissions()

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })

  if (!user || !user.role) {
    throw new ApiError(404, 'User not found')
  }

  if (user.status !== 'ACTIVE') {
    throw new ApiError(403, 'User account is not active')
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map(item => item.permission.name),
  }
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user || user.passwordHash !== password) {
    throw new ApiError(401, 'Invalid email or password')
  }

  return getUserByEmail(normalizedEmail)
}
