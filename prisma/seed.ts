import { PrismaClient } from '@prisma/client'
import { PERMISSIONS, ROLE_PERMISSIONS } from '../lib/auth/constants'

const prisma = new PrismaClient()

const permissionNames = Object.values(PERMISSIONS)

function splitPermission(permission: string) {
  const [module, action] = permission.split('.', 2)
  return {
    module,
    action,
  }
}

async function seedPermissions() {
  for (const permission of permissionNames) {
    const { module, action } = splitPermission(permission)
    await prisma.permission.upsert({
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
  }
}

async function seedRoles() {
  const permissions = await prisma.permission.findMany()
  const permissionMap = new Map(permissions.map(permission => [permission.name, permission.id]))

  for (const [roleName, rolePermissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {
        description: `${roleName.replace(/_/g, ' ')} role`,
      },
      create: {
        name: roleName,
        description: `${roleName.replace(/_/g, ' ')} role`,
      },
    })

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    })

    const assignedPermissions =
      rolePermissions.includes('*') ? permissionNames : rolePermissions

    for (const permissionName of assignedPermissions) {
      const permissionId = permissionMap.get(permissionName)
      if (!permissionId) {
        continue
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId,
        },
      })
    }
  }
}

async function seedUsersAndAcademics() {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  })

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found')
  }

  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {
      name: 'Super Admin',
      passwordHash: 'admin123',
      roleId: superAdminRole.id,
      status: 'ACTIVE',
    },
    create: {
      name: 'Super Admin',
      email: 'admin@school.com',
      phone: '01700000000',
      passwordHash: 'admin123',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const mathTeacherUser = await prisma.user.upsert({
    where: { email: 'sarah@school.com' },
    update: {},
    create: {
      name: 'Sarah Khan',
      email: 'sarah@school.com',
      phone: '01712345690',
      passwordHash: 'seeded-password',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const englishTeacherUser = await prisma.user.upsert({
    where: { email: 'karim@school.com' },
    update: {},
    create: {
      name: 'Karim Ali',
      email: 'karim@school.com',
      phone: '01712345691',
      passwordHash: 'seeded-password',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const mathTeacher = await prisma.teacher.upsert({
    where: { userId: mathTeacherUser.id },
    update: {},
    create: {
      userId: mathTeacherUser.id,
      teacherId: 'T-001',
      qualification: 'M.Sc',
      joiningDate: new Date('2020-01-10'),
      status: 'ACTIVE',
    },
  })

  const englishTeacher = await prisma.teacher.upsert({
    where: { userId: englishTeacherUser.id },
    update: {},
    create: {
      userId: englishTeacherUser.id,
      teacherId: 'T-002',
      qualification: 'M.A',
      joiningDate: new Date('2019-06-15'),
      status: 'ACTIVE',
    },
  })

  const class9 = await prisma.class.upsert({
    where: { name: 'Class 9' },
    update: {
      capacity: 40,
      room: '101',
      classTeacherId: mathTeacher.id,
    },
    create: {
      name: 'Class 9',
      capacity: 40,
      room: '101',
      classTeacherId: mathTeacher.id,
    },
  })

  const class10 = await prisma.class.upsert({
    where: { name: 'Class 10' },
    update: {
      capacity: 42,
      room: '201',
      classTeacherId: englishTeacher.id,
    },
    create: {
      name: 'Class 10',
      capacity: 42,
      room: '201',
      classTeacherId: englishTeacher.id,
    },
  })

  await prisma.section.upsert({
    where: { name_classId: { name: 'A', classId: class9.id } },
    update: {},
    create: {
      name: 'A',
      classId: class9.id,
    },
  })

  const class10A = await prisma.section.upsert({
    where: { name_classId: { name: 'A', classId: class10.id } },
    update: {},
    create: {
      name: 'A',
      classId: class10.id,
    },
  })

  const mathematics = await prisma.subject.upsert({
    where: { name_classId: { name: 'Mathematics', classId: class10.id } },
    update: {
      teacherId: mathTeacher.id,
    },
    create: {
      name: 'Mathematics',
      code: 'MTH',
      classId: class10.id,
      teacherId: mathTeacher.id,
    },
  })

  const english = await prisma.subject.upsert({
    where: { name_classId: { name: 'English', classId: class10.id } },
    update: {
      teacherId: englishTeacher.id,
    },
    create: {
      name: 'English',
      code: 'ENG',
      classId: class10.id,
      teacherId: englishTeacher.id,
    },
  })

  const parentUser = await prisma.user.upsert({
    where: { email: 'karim.parent@school.com' },
    update: {},
    create: {
      name: 'Karim Ahmed',
      email: 'karim.parent@school.com',
      phone: '01712345678',
      passwordHash: 'seeded-password',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      occupation: 'Business',
      address: 'Dhaka',
    },
  })

  const studentUser = await prisma.user.upsert({
    where: { email: 'rahim@school.com' },
    update: {},
    create: {
      name: 'Rahim Ahmed',
      email: 'rahim@school.com',
      phone: '01712345678',
      passwordHash: 'seeded-password',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: 'S-001',
      rollNumber: '001',
      admissionDate: new Date('2023-01-15'),
      status: 'ACTIVE',
      classId: class10.id,
      sectionId: class10A.id,
      parentId: parent.id,
    },
  })

  const studentUser2 = await prisma.user.upsert({
    where: { email: 'fatima@school.com' },
    update: {},
    create: {
      name: 'Fatima Begum',
      email: 'fatima@school.com',
      phone: '01712345679',
      passwordHash: 'seeded-password',
      status: 'ACTIVE',
      roleId: superAdminRole.id,
    },
  })

  const student2 = await prisma.student.upsert({
    where: { userId: studentUser2.id },
    update: {},
    create: {
      userId: studentUser2.id,
      studentId: 'S-002',
      rollNumber: '002',
      admissionDate: new Date('2023-01-15'),
      status: 'ACTIVE',
      classId: class10.id,
      sectionId: class10A.id,
      parentId: parent.id,
    },
  })

  await prisma.exam.upsert({
    where: { id: 'seed-midterm-math' },
    update: {},
    create: {
      id: 'seed-midterm-math',
      title: 'Midterm Exam',
      classId: class10.id,
      subjectId: mathematics.id,
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-15'),
      totalMarks: 100,
      status: 'PUBLISHED',
    },
  })

  await prisma.exam.upsert({
    where: { id: 'seed-midterm-english' },
    update: {},
    create: {
      id: 'seed-midterm-english',
      title: 'Midterm Exam',
      classId: class10.id,
      subjectId: english.id,
      startDate: new Date('2024-06-16'),
      endDate: new Date('2024-06-16'),
      totalMarks: 100,
      status: 'PUBLISHED',
    },
  })

  await prisma.attendance.upsert({
    where: { id: 'seed-attendance-1' },
    update: {},
    create: {
      id: 'seed-attendance-1',
      date: new Date('2024-06-01'),
      status: 'PRESENT',
      studentId: student.id,
    },
  })

  await prisma.attendance.upsert({
    where: { id: 'seed-attendance-2' },
    update: {},
    create: {
      id: 'seed-attendance-2',
      date: new Date('2024-06-01'),
      status: 'PRESENT',
      studentId: student2.id,
    },
  })

  await prisma.fee.upsert({
    where: { id: 'seed-fee-1' },
    update: {},
    create: {
      id: 'seed-fee-1',
      title: 'Monthly Fee',
      studentId: student.id,
      amount: 5000,
      dueDate: new Date('2024-06-30'),
      status: 'PAID',
      month: 'June',
    },
  })

  await prisma.fee.upsert({
    where: { id: 'seed-fee-2' },
    update: {},
    create: {
      id: 'seed-fee-2',
      title: 'Monthly Fee',
      studentId: student2.id,
      amount: 5000,
      dueDate: new Date('2024-06-30'),
      status: 'PENDING',
      month: 'June',
    },
  })

  await prisma.homework.upsert({
    where: { id: 'seed-homework-1' },
    update: {},
    create: {
      id: 'seed-homework-1',
      title: 'Algebra Worksheet',
      description: 'Complete chapter 3 exercises',
      classId: class10.id,
      subjectId: mathematics.id,
      teacherId: mathTeacher.id,
      dueDate: new Date('2024-06-20'),
    },
  })

  await prisma.homework.upsert({
    where: { id: 'seed-homework-2' },
    update: {},
    create: {
      id: 'seed-homework-2',
      title: 'Essay Writing',
      description: 'Write an essay on your school',
      classId: class9.id,
      subjectId: english.id,
      teacherId: englishTeacher.id,
      dueDate: new Date('2024-06-21'),
    },
  })
}

async function seedSettings() {
  await prisma.websiteSetting.upsert({
    where: { id: 'default-website-settings' },
    update: {},
    create: {
      id: 'default-website-settings',
      schoolName: 'School Management System',
      phone: '01700000000',
      email: 'info@school.com',
      address: 'Dhaka, Bangladesh',
      locale: 'en',
      timezone: 'Asia/Dhaka',
      darkModeEnabled: true,
    },
  })

  await prisma.themeSetting.upsert({
    where: { id: 'default-theme-settings' },
    update: {},
    create: {
      id: 'default-theme-settings',
      mode: 'LIGHT',
      primaryColor: 'oklch(0.205 0 0)',
      primaryForeground: 'oklch(0.985 0 0)',
      secondaryColor: 'oklch(0.97 0 0)',
      secondaryForeground: 'oklch(0.205 0 0)',
      accentColor: 'oklch(0.97 0 0)',
      accentForeground: 'oklch(0.205 0 0)',
      sidebarPrimary: 'oklch(0.205 0 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0 0)',
    },
  })
}

async function main() {
  await seedPermissions()
  await seedRoles()
  await seedUsersAndAcademics()
  await seedSettings()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
