export type Role = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PRINCIPAL'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF'

export type Permission = string // e.g., "student.view", "student.create", "student.edit", "student.delete"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  permissions: Permission[]
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
}
