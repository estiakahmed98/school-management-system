import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import type { Permission, Role } from '@/lib/auth/types'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: Role
      permissions: Permission[]
    }
  }

  interface User {
    id: string
    role: Role
    permissions: Permission[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
    permissions?: Permission[]
  }
}
