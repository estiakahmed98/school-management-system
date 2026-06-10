import type { Permission } from './types'

export const PERMISSIONS = {
  // Student Permissions
  STUDENT_VIEW: 'student.view',
  STUDENT_CREATE: 'student.create',
  STUDENT_EDIT: 'student.update',
  STUDENT_DELETE: 'student.delete',

  // Teacher Permissions
  TEACHER_VIEW: 'teacher.view',
  TEACHER_CREATE: 'teacher.create',
  TEACHER_EDIT: 'teacher.update',
  TEACHER_DELETE: 'teacher.delete',

  // Staff Permissions
  STAFF_VIEW: 'staff.view',
  STAFF_CREATE: 'staff.create',
  STAFF_EDIT: 'staff.update',
  STAFF_DELETE: 'staff.delete',

  // Parent Permissions
  PARENT_VIEW: 'parent.view',
  PARENT_CREATE: 'parent.create',
  PARENT_EDIT: 'parent.update',
  PARENT_DELETE: 'parent.delete',

  // Attendance Permissions
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_EDIT: 'attendance.update',
  ATTENDANCE_DELETE: 'attendance.delete',

  // Class Permissions
  CLASS_VIEW: 'class.view',
  CLASS_CREATE: 'class.create',
  CLASS_EDIT: 'class.update',
  CLASS_DELETE: 'class.delete',

  // Subject Permissions
  SUBJECT_VIEW: 'subject.view',
  SUBJECT_CREATE: 'subject.create',
  SUBJECT_EDIT: 'subject.update',
  SUBJECT_DELETE: 'subject.delete',

  // Exam Permissions
  EXAM_VIEW: 'exam.view',
  EXAM_CREATE: 'exam.create',
  EXAM_EDIT: 'exam.update',
  EXAM_DELETE: 'exam.delete',

  // Result Permissions
  RESULT_VIEW: 'result.view',
  RESULT_CREATE: 'result.create',
  RESULT_EDIT: 'result.update',
  RESULT_DELETE: 'result.delete',

  // Fee Permissions
  FEE_VIEW: 'fees.view',
  FEE_CREATE: 'fees.create',
  FEE_EDIT: 'fees.update',
  FEE_DELETE: 'fees.delete',

  // Accounts Permissions
  ACCOUNTS_VIEW: 'accounts.view',
  ACCOUNTS_CREATE: 'accounts.create',
  ACCOUNTS_EDIT: 'accounts.update',
  ACCOUNTS_DELETE: 'accounts.delete',

  // Payroll Permissions
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_EDIT: 'payroll.update',
  PAYROLL_DELETE: 'payroll.delete',

  // Inventory Permissions
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_CREATE: 'inventory.create',
  INVENTORY_EDIT: 'inventory.update',
  INVENTORY_DELETE: 'inventory.delete',

  // Transport Permissions
  TRANSPORT_VIEW: 'transport.view',
  TRANSPORT_CREATE: 'transport.create',
  TRANSPORT_EDIT: 'transport.update',
  TRANSPORT_DELETE: 'transport.delete',

  // Homework Permissions
  HOMEWORK_VIEW: 'homework.view',
  HOMEWORK_CREATE: 'homework.create',
  HOMEWORK_EDIT: 'homework.update',
  HOMEWORK_DELETE: 'homework.delete',

  // SMS Permissions
  SMS_VIEW: 'sms.view',
  SMS_CREATE: 'sms.create',
  SMS_EDIT: 'sms.update',
  SMS_DELETE: 'sms.delete',

  // Settings Permissions
  SETTINGS_ROLES: 'settings.role.view',
  SETTINGS_PERMISSIONS: 'settings.permission.view',
  SETTINGS_THEME: 'theme.update',
} as const

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    // All permissions except settings
    ...Object.values(PERMISSIONS).filter(p => !p.startsWith('settings.')),
  ],
  PRINCIPAL: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.TEACHER_CREATE,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.CLASS_VIEW,
    PERMISSIONS.SUBJECT_VIEW,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.RESULT_VIEW,
    PERMISSIONS.FEE_VIEW,
    PERMISSIONS.ACCOUNTS_VIEW,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.SETTINGS_THEME,
  ],
  TEACHER: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_CREATE,
    PERMISSIONS.ATTENDANCE_EDIT,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.RESULT_VIEW,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.SETTINGS_THEME,
  ],
  STUDENT: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.FEE_VIEW,
    PERMISSIONS.SETTINGS_THEME,
  ],
  PARENT: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.EXAM_VIEW,
    PERMISSIONS.FEE_VIEW,
    PERMISSIONS.SETTINGS_THEME,
  ],
  STAFF: [
    PERMISSIONS.STUDENT_VIEW,
    PERMISSIONS.TEACHER_VIEW,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.TRANSPORT_VIEW,
    PERMISSIONS.SETTINGS_THEME,
  ],
}
