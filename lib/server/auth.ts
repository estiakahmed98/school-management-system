import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/server/api'

export async function getUserByEmail(email: string) {
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
