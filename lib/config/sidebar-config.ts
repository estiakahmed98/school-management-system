import {
  LayoutGrid,
  Users,
  BookOpen,
  FileText,
  DollarSign,
  Package,
  Bus,
  MessageSquare,
  Settings,
  BarChart3,
  Calendar,
  GraduationCap,
  Home,
  Clock,
  ReceiptText,
  Briefcase,
} from 'lucide-react'
import { SidebarItem } from '@/components/layout/app-sidebar'
import { PERMISSIONS } from '@/lib/auth/constants'

export const sidebarConfig: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: 'Academics',
    icon: BookOpen,
    children: [
      {
        title: 'Students',
        href: '/dashboard/students',
        icon: Users,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        title: 'Teachers',
        href: '/dashboard/teachers',
        icon: Users,
        permission: PERMISSIONS.TEACHER_VIEW,
      },
      {
        title: 'Classes',
        href: '/dashboard/classes',
        icon: Home,
        permission: PERMISSIONS.CLASS_VIEW,
      },
      {
        title: 'Subjects',
        href: '/dashboard/subjects',
        icon: BookOpen,
        permission: PERMISSIONS.SUBJECT_VIEW,
      },
      {
        title: 'Attendance',
        href: '/dashboard/attendance',
        icon: Clock,
        permission: PERMISSIONS.ATTENDANCE_VIEW,
      },
    ],
  },
  {
    title: 'Exams & Results',
    icon: GraduationCap,
    children: [
      {
        title: 'Exams',
        href: '/dashboard/exams',
        icon: FileText,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        title: 'Results',
        href: '/dashboard/results',
        icon: BarChart3,
        permission: PERMISSIONS.RESULT_VIEW,
      },
      {
        title: 'Class Routine',
        href: '/dashboard/routines/class',
        icon: Calendar,
        permission: PERMISSIONS.CLASS_VIEW,
      },
      {
        title: 'Exam Routine',
        href: '/dashboard/routines/exam',
        icon: Calendar,
        permission: PERMISSIONS.EXAM_VIEW,
      },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    children: [
      {
        title: 'Fees',
        href: '/dashboard/fees',
        icon: DollarSign,
        permission: PERMISSIONS.FEE_VIEW,
      },
      {
        title: 'Payroll',
        href: '/dashboard/payroll',
        icon: ReceiptText,
        permission: PERMISSIONS.PAYROLL_VIEW,
      },
      {
        title: 'Accounts',
        href: '/dashboard/accounts',
        icon: Briefcase,
        permission: PERMISSIONS.ACCOUNTS_VIEW,
      },
    ],
  },
  {
    title: 'Operations',
    icon: Package,
    children: [
      {
        title: 'Staff',
        href: '/dashboard/staff',
        icon: Users,
        permission: PERMISSIONS.STAFF_VIEW,
      },
      {
        title: 'Parents',
        href: '/dashboard/parents',
        icon: Users,
        permission: PERMISSIONS.PARENT_VIEW,
      },
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Package,
        permission: PERMISSIONS.INVENTORY_VIEW,
      },
      {
        title: 'Transport',
        href: '/dashboard/transport',
        icon: Bus,
        permission: PERMISSIONS.TRANSPORT_VIEW,
      },
    ],
  },
  {
    title: 'Content',
    icon: FileText,
    children: [
      {
        title: 'Homework',
        href: '/dashboard/homework',
        icon: FileText,
        permission: PERMISSIONS.HOMEWORK_VIEW,
      },
      {
        title: 'Lesson Plan',
        href: '/dashboard/lesson-plan',
        icon: BookOpen,
        permission: PERMISSIONS.TEACHER_VIEW,
      },
      {
        title: 'Lectures',
        href: '/dashboard/lectures',
        icon: MessageSquare,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
    ],
  },
  {
    title: 'Communication',
    icon: MessageSquare,
    children: [
      {
        title: 'SMS',
        href: '/dashboard/sms',
        icon: MessageSquare,
        permission: PERMISSIONS.SMS_VIEW,
      },
      {
        title: 'Admission',
        href: '/dashboard/admission',
        icon: Users,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      {
        title: 'Roles',
        href: '/dashboard/settings/roles',
        icon: Users,
        permission: PERMISSIONS.SETTINGS_ROLES,
      },
      {
        title: 'Permissions',
        href: '/dashboard/settings/permissions',
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_PERMISSIONS,
      },
      {
        title: 'Theme',
        href: '/dashboard/settings/theme',
        icon: Settings,
        permission: PERMISSIONS.SETTINGS_THEME,
      },
    ],
  },
]
