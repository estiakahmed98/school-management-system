import { SidebarItemData } from '@/components/layout/app-sidebar'
import { PERMISSIONS } from '@/lib/auth/constants'

export const sidebarConfig: SidebarItemData[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'layoutGrid',
  },
  {
    title: 'Academics',
    icon: 'bookOpen',
    children: [
      {
        title: 'Students',
        href: '/dashboard/students',
        icon: 'users',
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        title: 'Teachers',
        href: '/dashboard/teachers',
        icon: 'users',
        permission: PERMISSIONS.TEACHER_VIEW,
      },
      {
        title: 'Classes',
        href: '/dashboard/classes',
        icon: 'home',
        permission: PERMISSIONS.CLASS_VIEW,
      },
      {
        title: 'Subjects',
        href: '/dashboard/subjects',
        icon: 'bookOpen',
        permission: PERMISSIONS.SUBJECT_VIEW,
      },
      {
        title: 'Attendance',
        href: '/dashboard/attendance',
        icon: 'clock',
        permission: PERMISSIONS.ATTENDANCE_VIEW,
      },
    ],
  },
  {
    title: 'Exams & Results',
    icon: 'graduationCap',
    children: [
      {
        title: 'Exams',
        href: '/dashboard/exams',
        icon: 'fileText',
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        title: 'Results',
        href: '/dashboard/results',
        icon: 'barChart3',
        permission: PERMISSIONS.RESULT_VIEW,
      },
      {
        title: 'Class Routine',
        href: '/dashboard/routines/class',
        icon: 'calendar',
        permission: PERMISSIONS.CLASS_VIEW,
      },
      {
        title: 'Exam Routine',
        href: '/dashboard/routines/exam',
        icon: 'calendar',
        permission: PERMISSIONS.EXAM_VIEW,
      },
    ],
  },
  {
    title: 'Finance',
    icon: 'dollarSign',
    children: [
      {
        title: 'Fees',
        href: '/dashboard/fees',
        icon: 'dollarSign',
        permission: PERMISSIONS.FEE_VIEW,
      },
      {
        title: 'Payroll',
        href: '/dashboard/payroll',
        icon: 'receiptText',
        permission: PERMISSIONS.PAYROLL_VIEW,
      },
      {
        title: 'Accounts',
        href: '/dashboard/accounts',
        icon: 'briefcase',
        permission: PERMISSIONS.ACCOUNTS_VIEW,
      },
    ],
  },
  {
    title: 'Operations',
    icon: 'package',
    children: [
      {
        title: 'Staff',
        href: '/dashboard/staff',
        icon: 'users',
        permission: PERMISSIONS.STAFF_VIEW,
      },
      {
        title: 'Parents',
        href: '/dashboard/parents',
        icon: 'users',
        permission: PERMISSIONS.PARENT_VIEW,
      },
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: 'package',
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
      {
        title: 'Transport',
        href: '/dashboard/transport',
        icon: 'bus',
        permission: PERMISSIONS.TRANSPORT_VIEW,
      },
    ],
  },
  {
    title: 'Content',
    icon: 'fileText',
    children: [
      {
        title: 'Homework',
        href: '/dashboard/homework',
        icon: 'fileText',
        permission: PERMISSIONS.HOMEWORK_VIEW,
      },
      {
        title: 'Lesson Plan',
        href: '/dashboard/lesson-plan',
        icon: 'bookOpen',
        permission: PERMISSIONS.TEACHER_VIEW,
      },
      {
        title: 'Lectures',
        href: '/dashboard/lectures',
        icon: 'messageSquare',
        permission: PERMISSIONS.STUDENT_VIEW,
      },
    ],
  },
  {
    title: 'Communication',
    icon: 'messageSquare',
    children: [
      {
        title: 'SMS',
        href: '/dashboard/sms',
        icon: 'messageSquare',
        permission: PERMISSIONS.SMS_VIEW,
      },
      {
        title: 'Admission',
        href: '/dashboard/admission',
        icon: 'users',
        permission: PERMISSIONS.STUDENT_VIEW,
      },
    ],
  },
  {
    title: 'Settings',
    icon: 'settings',
    children: [
      {
        title: 'Roles',
        href: '/dashboard/settings/roles',
        icon: 'users',
        permission: PERMISSIONS.SETTINGS_ROLES,
      },
      {
        title: 'Permissions',
        href: '/dashboard/settings/permissions',
        icon: 'settings',
        permission: PERMISSIONS.SETTINGS_PERMISSIONS,
      },
      {
        title: 'Theme',
        href: '/dashboard/settings/theme',
        icon: 'settings',
        permission: PERMISSIONS.SETTINGS_THEME,
      },
    ],
  },
]
