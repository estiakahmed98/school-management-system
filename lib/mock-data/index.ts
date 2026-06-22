// Legacy shared UI types. The API layer now uses Prisma instead of in-memory arrays.

export interface Student {
  id: string
  name: string
  rollNumber: string
  class: string
  section: string
  parentName: string
  phone: string
  email: string
  admissionDate: string
  status: 'active' | 'inactive'
}

export interface Teacher {
  id: string
  name: string
  subject: string
  qualification: string
  phone: string
  email: string
  joinDate: string
  status: 'active' | 'inactive'
}

export interface Staff {
  id: string
  name: string
  position: string
  department: string
  phone: string
  email: string
  joinDate: string
  status: 'active' | 'inactive'
}

export interface Parent {
  id: string
  name: string
  phone: string
  email: string
  occupation: string
  address: string
  children: number
}

export interface Class {
  id: string
  name: string
  capacity: number
  classTeacher: string
  room: string
  section: string
}

export interface Section {
  id: string
  name: string
  class: string
}

export interface Subject {
  id: string
  name: string
  code: string
  class: string
  teacher: string
}

export interface Attendance {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'leave'
}

export interface Exam {
  id: string
  name: string
  class: string
  date: string
  subject: string
  totalMarks: number
}

export interface Result {
  id: string
  exam: string
  student: string
  totalMarks: number
  grade: string
  gpa: number | null
  position: number | null
  isPublished: boolean
}

export interface Fee {
  id: string
  studentId: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'partial'
  month: string
}

export interface AccountTransaction {
  id: string
  title: string
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  note: string
}

export interface Payroll {
  id: string
  employeeName: string
  employeeType: 'teacher' | 'staff'
  month: string
  amount: number
  status: 'paid' | 'pending'
  paidDate: string | null
}

export interface Inventory {
  id: string
  name: string
  quantity: number
  unit: string
  price: number
  note: string
}

export interface Transport {
  id: string
  routeName: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  fee: number
}

export interface Homework {
  id: string
  title: string
  description: string
  class: string
  subject: string
  dueDate: string
}

export interface LessonPlan {
  id: string
  title: string
  description: string
  class: string
  subject: string
  teacher: string
  date: string
}

export interface Lecture {
  id: string
  title: string
  description: string
  class: string
  section: string
  subject: string
  teacher: string
  student: string
  date: string
}

export interface SmsLog {
  id: string
  receiver: string
  message: string
  type: string
  status: string
  createdAt: string
}

export interface Admission {
  id: string
  studentName: string
  email: string
  phone: string
  className: string
  classId: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  parentName?: string
  studentUserName?: string
  createdAt: string
  updatedAt: string
}
