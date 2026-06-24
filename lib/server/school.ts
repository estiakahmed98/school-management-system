import {
  AttendanceStatus,
  AdmissionStatus,
  EmployeeType,
  FeeStatus,
  PayrollStatus,
  ThemeMode,
  TransactionType,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, asRecord } from "@/lib/server/api";
import type {
  AccountTransaction,
  Attendance,
  Class,
  Fee,
  Homework,
  Inventory,
  LessonPlan,
  Lecture,
  Parent,
  Payroll,
  Result,
  Section,
  Admission,
  SmsLog,
  Staff,
  Student,
  Subject,
  Teacher,
  Transport,
} from "@/lib/mock-data";

type RecordValue = Record<string, unknown>;

const ACTIVE_STATUS = UserStatus.ACTIVE;

function toUserStatus(value: string) {
  return value.toUpperCase() as UserStatus;
}

function toAttendanceStatus(value: string) {
  return value.toUpperCase() as AttendanceStatus;
}

function toFeeStatus(value: string) {
  return value.toUpperCase() as FeeStatus;
}

function toTransactionType(value: string) {
  return value.toUpperCase() as TransactionType;
}

function toEmployeeType(value: string) {
  return value.toUpperCase() as EmployeeType;
}

function toPayrollStatus(value: string) {
  return value.toUpperCase() as PayrollStatus;
}

function toThemeMode(value: string) {
  return value.toUpperCase() as ThemeMode;
}

function toAdmissionStatus(value: string) {
  return value.toUpperCase() as AdmissionStatus;
}

function getString(
  data: RecordValue,
  key: string,
  options: { required?: boolean; defaultValue?: string } = {},
) {
  const value = data[key];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (options.required === false) {
    return options.defaultValue ?? "";
  }

  throw new ApiError(400, `${key} is required`);
}

function getOptionalString(data: RecordValue, key: string) {
  const value = data[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${key} must be a string`);
  }

  return value.trim();
}

function getNumber(
  data: RecordValue,
  key: string,
  options: { required?: boolean; defaultValue?: number } = {},
) {
  const value = data[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (options.required === false) {
    return options.defaultValue ?? 0;
  }

  throw new ApiError(400, `${key} must be a valid number`);
}

function getBoolean(data: RecordValue, key: string, defaultValue = false) {
  const value = data[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined) {
    return defaultValue;
  }

  throw new ApiError(400, `${key} must be a boolean`);
}

function getDateString(data: RecordValue, key: string, fallback = new Date()) {
  const value = data[key];

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ApiError(400, `${key} must be a valid date`);
    }
    return parsed;
  }

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  throw new ApiError(400, `${key} must be a valid date`);
}

function toIsoDate(value: Date | null | undefined) {
  if (!value) {
    return "";
  }

  return value.toISOString().split("T")[0];
}

function toStatus(value: string | null | undefined): "active" | "inactive" {
  return value === ACTIVE_STATUS ? "active" : "inactive";
}

async function findOrCreateClass(
  name: string,
  payload?: {
    capacity?: number;
    room?: string;
    classTeacherId?: string | null;
  },
) {
  const existing = await prisma.class.findFirst({
    where: { name },
  });

  if (existing) {
    return existing;
  }

  return prisma.class.create({
    data: {
      name,
      capacity: payload?.capacity ?? 40,
      room: payload?.room ?? "",
      classTeacherId: payload?.classTeacherId ?? null,
    },
  });
}

async function findOrCreateSection(
  classId: string,
  name: string,
  payload?: { classTeacherId?: string | null },
) {
  const existing = await prisma.section.findFirst({
    where: { classId, name },
  });

  if (existing) {
    return existing;
  }

  return prisma.section.create({
    data: {
      classId,
      name,
      classTeacherId: payload?.classTeacherId ?? null,
    },
  });
}

async function findOrCreateTeacherByName(name: string) {
  const existing = await prisma.teacher.findFirst({
    where: { user: { name } },
    include: { user: true },
  });

  if (existing) {
    return existing;
  }

  const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@school.com`;

  return prisma.teacher.create({
    data: {
      teacherId: `T-${Date.now()}`,
      qualification: "",
      user: {
        create: {
          name,
          email,
          phone: "",
          passwordHash: "seeded-password",
          status: ACTIVE_STATUS,
        },
      },
    },
    include: { user: true },
  });
}

async function findOrCreateSubject(
  name: string,
  classId: string,
  teacherId?: string | null,
) {
  const existing = await prisma.subject.findFirst({
    where: { name, classId },
  });

  if (existing) {
    return existing;
  }

  return prisma.subject.create({
    data: {
      name,
      classId,
      teacherId: teacherId ?? null,
      code: name.slice(0, 3).toUpperCase(),
    },
  });
}

async function findOrCreateParentByName(payload: {
  name: string;
  phone: string;
  email: string;
  occupation?: string | null;
  address?: string | null;
}) {
  const email = normalizeEmail(payload.email);
  const existing = await prisma.parent.findFirst({
    where: { user: { email } },
    include: { user: true, students: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.parent.create({
    data: {
      occupation: payload.occupation,
      address: payload.address,
      user: {
        create: {
          name: payload.name,
          email,
          phone: payload.phone,
          passwordHash: "seeded-password",
          status: ACTIVE_STATUS,
        },
      },
    },
    include: { user: true, students: true },
  });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function buildParentEmail(studentEmail: string) {
  const normalized = normalizeEmail(studentEmail);
  const [localPart, domainPart] = normalized.split("@");

  if (!domainPart) {
    return `${normalized}.parent@school.com`;
  }

  return `${localPart}.parent@${domainPart}`;
}

function getStringArray(data: RecordValue, key: string) {
  if (!Array.isArray(data[key])) {
    return null;
  }

  return Array.from(
    new Set(
      data[key]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

async function syncParentStudents(parentId: string, studentIds: string[]) {
  if (studentIds.length > 0) {
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true },
    });

    if (students.length !== studentIds.length) {
      throw new ApiError(404, "One or more selected students were not found");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.student.updateMany({
      where: {
        parentId,
        id: { notIn: studentIds },
      },
      data: { parentId: null },
    });

    if (studentIds.length > 0) {
      await tx.student.updateMany({
        where: { id: { in: studentIds } },
        data: { parentId },
      });
    }
  });
}

async function findStudentByName(name: string) {
  return prisma.student.findFirst({
    where: { user: { name } },
    include: { user: true, class: true, section: true },
  });
}

function mapStudent(record: {
  id: string;
  rollNumber: string;
  admissionDate: Date | null;
  status: string;
  section: { name: string } | null;
  class: { name: string };
  parent: { id: string; user: { name: string } } | null;
  user: { name: string; email: string; phone: string | null };
}): Student {
  return {
    id: record.id,
    name: record.user.name,
    rollNumber: record.rollNumber,
    class: record.class.name,
    section: record.section?.name ?? "",
    parentId: record.parent?.id ?? "",
    parentName: record.parent?.user.name ?? "",
    phone: record.user.phone ?? "",
    email: record.user.email,
    admissionDate: toIsoDate(record.admissionDate),
    status: toStatus(record.status),
  };
}

function mapTeacher(record: {
  id: string;
  qualification: string | null;
  joiningDate: Date | null;
  status: string;
  subjects: { name: string }[];
  user: { name: string; email: string; phone: string | null };
}): Teacher {
  return {
    id: record.id,
    name: record.user.name,
    subject: record.subjects[0]?.name ?? "",
    qualification: record.qualification ?? "",
    phone: record.user.phone ?? "",
    email: record.user.email,
    joinDate: toIsoDate(record.joiningDate),
    status: toStatus(record.status),
  };
}

function mapStaff(record: {
  id: string;
  position: string | null;
  department: string | null;
  joiningDate: Date | null;
  status: string;
  user: { name: string; email: string; phone: string | null };
}): Staff {
  return {
    id: record.id,
    name: record.user.name,
    position: record.position ?? "",
    department: record.department ?? "",
    phone: record.user.phone ?? "",
    email: record.user.email,
    joinDate: toIsoDate(record.joiningDate),
    status: toStatus(record.status),
  };
}

function mapParent(record: {
  id: string;
  occupation: string | null;
  address: string | null;
  students: {
    id: string;
    rollNumber: string;
    class: { name: string };
    section: { name: string } | null;
    user: { name: string };
  }[];
  user: { name: string; email: string; phone: string | null };
}): Parent {
  return {
    id: record.id,
    name: record.user.name,
    phone: record.user.phone ?? "",
    email: record.user.email,
    occupation: record.occupation ?? "",
    address: record.address ?? "",
    children: record.students.length,
    linkedStudents: record.students.map((student) => ({
      id: student.id,
      name: student.user.name,
      rollNumber: student.rollNumber,
      class: student.class.name,
      section: student.section?.name ?? "",
    })),
  };
}

function mapClass(record: {
  id: string;
  name: string;
  capacity: number | null;
  room: string | null;
  classTeacher: { user: { name: string } } | null;
  sections: {
    id: string;
    name: string;
    classTeacher: { user: { name: string } } | null;
  }[];
}): Class[] {
  return record.sections.map((section) => ({
    id: section.id,
    name: record.name,
    capacity: record.capacity ?? 0,
    classTeacher:
      section.classTeacher?.user.name ?? record.classTeacher?.user.name ?? "",
    room: record.room ?? "",
    section: section.name,
  }));
}

function mapSection(record: {
  id: string;
  name: string;
  class: { name: string };
}): Section {
  return {
    id: record.id,
    name: record.name,
    class: record.class.name,
  };
}

function mapSubject(record: {
  id: string;
  name: string;
  code: string | null;
  class: { name: string };
  teacher: { user: { name: string } } | null;
}): Subject {
  return {
    id: record.id,
    name: record.name,
    code: record.code ?? "",
    class: record.class.name,
    teacher: record.teacher?.user.name ?? "",
  };
}

function mapAttendance(record: {
  id: string;
  date: Date;
  status: string;
  student: { studentId: string } | null;
}): Attendance {
  return {
    id: record.id,
    studentId: record.student?.studentId ?? "",
    date: toIsoDate(record.date),
    status: record.status.toLowerCase() as Attendance["status"],
  };
}

function mapExam(record: {
  id: string;
  title: string;
  startDate: Date;
  totalMarks: number;
  class: { name: string };
  subject: { name: string } | null;
}): import("@/lib/mock-data").Exam {
  return {
    id: record.id,
    name: record.title,
    class: record.class.name,
    date: toIsoDate(record.startDate),
    subject: record.subject?.name ?? "",
    totalMarks: record.totalMarks,
  };
}

function mapResult(record: {
  id: string;
  totalMarks: number;
  grade: string | null;
  gpa: number | null;
  position: number | null;
  isPublished: boolean;
  exam: { title: string };
  student: { user: { name: string } };
}): Result {
  return {
    id: record.id,
    exam: record.exam.title,
    student: record.student.user.name,
    totalMarks: record.totalMarks,
    grade: record.grade ?? "",
    gpa: record.gpa,
    position: record.position,
    isPublished: record.isPublished,
  };
}

function mapFee(record: {
  id: string;
  amount: number;
  dueDate: Date | null;
  status: string;
  month: string;
  student: { studentId: string };
}): Fee {
  return {
    id: record.id,
    studentId: record.student.studentId,
    amount: record.amount,
    dueDate: toIsoDate(record.dueDate),
    status: record.status.toLowerCase() as Fee["status"],
    month: record.month,
  };
}

function mapAccount(record: {
  id: string;
  title: string;
  type: string;
  amount: number;
  category: string;
  date: Date;
  note: string | null;
}): AccountTransaction {
  return {
    id: record.id,
    title: record.title,
    type: record.type.toLowerCase() as AccountTransaction["type"],
    amount: record.amount,
    category: record.category,
    date: toIsoDate(record.date),
    note: record.note ?? "",
  };
}

function mapPayroll(record: {
  id: string;
  employeeName: string;
  employeeType: string;
  month: string;
  amount: number;
  status: string;
  paidDate: Date | null;
}): Payroll {
  return {
    id: record.id,
    employeeName: record.employeeName,
    employeeType: record.employeeType.toLowerCase() as Payroll["employeeType"],
    month: record.month,
    amount: record.amount,
    status: record.status.toLowerCase() as Payroll["status"],
    paidDate: toIsoDate(record.paidDate) || null,
  };
}

function mapInventory(record: {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  price: number | null;
  note: string | null;
}): Inventory {
  return {
    id: record.id,
    name: record.name,
    quantity: record.quantity,
    unit: record.unit ?? "",
    price: record.price ?? 0,
    note: record.note ?? "",
  };
}

function mapTransport(record: {
  id: string;
  routeName: string;
  vehicleNo: string;
  driverName: string | null;
  driverPhone: string | null;
  fee: number | null;
}): Transport {
  return {
    id: record.id,
    routeName: record.routeName,
    vehicleNo: record.vehicleNo,
    driverName: record.driverName ?? "",
    driverPhone: record.driverPhone ?? "",
    fee: record.fee ?? 0,
  };
}

function mapHomework(record: {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  class: { name: string };
  subject: { name: string };
}): Homework {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    class: record.class.name,
    subject: record.subject.name,
    dueDate: toIsoDate(record.dueDate),
  };
}

function mapLessonPlan(record: {
  id: string;
  title: string;
  description: string | null;
  date: Date | null;
  class: { name: string };
  subject: { name: string };
  teacher: { user: { name: string } };
}): LessonPlan {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    class: record.class.name,
    subject: record.subject.name,
    teacher: record.teacher.user.name,
    date: toIsoDate(record.date),
  };
}

function mapLecture(record: {
  id: string;
  title: string;
  description: string | null;
  date: Date | null;
  class: { name: string };
  section: { name: string } | null;
  subject: { name: string };
  teacher: { user: { name: string } };
  student: { user: { name: string } } | null;
}): Lecture {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? "",
    class: record.class.name,
    section: record.section?.name ?? "",
    subject: record.subject.name,
    teacher: record.teacher.user.name,
    student: record.student?.user.name ?? "",
    date: toIsoDate(record.date),
  };
}

function mapSms(record: {
  id: string;
  receiver: string;
  message: string;
  type: string;
  status: string;
  createdAt: Date;
}): SmsLog {
  return {
    id: record.id,
    receiver: record.receiver,
    message: record.message,
    type: record.type,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  };
}

function mapAdmission(record: {
  id: string;
  studentName: string;
  email: string;
  phone: string | null;
  status: AdmissionStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  class: { id: string; name: string } | null;
  parent: { user: { name: string } } | null;
  student: { user: { name: string } } | null;
}): Admission {
  return {
    id: record.id,
    studentName: record.studentName,
    email: record.email,
    phone: record.phone ?? "",
    className: record.class?.name ?? "",
    classId: record.class?.id ?? "",
    status: record.status.toLowerCase() as Admission["status"],
    note: record.note ?? "",
    parentName: record.parent?.user.name,
    studentUserName: record.student?.user.name,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getTeacherSubject(name: string, classId: string) {
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [{ user: { name } }, { subjects: { some: { name } } }],
    },
  });

  const subject = await prisma.subject.findFirst({
    where: { name, classId },
  });

  return { teacher, subject };
}

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@school.com" },
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
  });

  if (!user || !user.role) {
    throw new ApiError(404, "Seed user not found. Run prisma db seed first.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    permissions: user.role.permissions.map((item) => item.permission.name),
  };
}

export async function getThemeSettings() {
  const theme = await prisma.themeSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!theme) {
    throw new ApiError(404, "Theme settings not found");
  }

  return {
    id: theme.id,
    mode: theme.mode.toLowerCase(),
    primary: theme.primaryColor,
    primaryForeground: theme.primaryForeground,
    secondary: theme.secondaryColor,
    secondaryForeground: theme.secondaryForeground,
    accent: theme.accentColor,
    accentForeground: theme.accentForeground,
    sidebarPrimary: theme.sidebarPrimary,
    sidebarPrimaryForeground: theme.sidebarPrimaryForeground,
  };
}

export async function updateThemeSettings(input: unknown) {
  const data = asRecord(input);
  const current = await prisma.themeSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!current) {
    throw new ApiError(404, "Theme settings not found");
  }

  const updated = await prisma.themeSetting.update({
    where: { id: current.id },
    data: {
      mode: toThemeMode(
        getString(data, "mode", {
          required: false,
          defaultValue: current.mode,
        }),
      ),
      primaryColor: getString(data, "primary", {
        required: false,
        defaultValue: current.primaryColor,
      }),
      primaryForeground: getString(data, "primaryForeground", {
        required: false,
        defaultValue: current.primaryForeground,
      }),
      secondaryColor: getString(data, "secondary", {
        required: false,
        defaultValue: current.secondaryColor,
      }),
      secondaryForeground: getString(data, "secondaryForeground", {
        required: false,
        defaultValue: current.secondaryForeground,
      }),
      accentColor: getString(data, "accent", {
        required: false,
        defaultValue: current.accentColor,
      }),
      accentForeground: getString(data, "accentForeground", {
        required: false,
        defaultValue: current.accentForeground,
      }),
      sidebarPrimary: getString(data, "sidebarPrimary", {
        required: false,
        defaultValue: current.sidebarPrimary,
      }),
      sidebarPrimaryForeground: getString(data, "sidebarPrimaryForeground", {
        required: false,
        defaultValue: current.sidebarPrimaryForeground,
      }),
    },
  });

  return {
    id: updated.id,
    mode: updated.mode.toLowerCase(),
    primary: updated.primaryColor,
    primaryForeground: updated.primaryForeground,
    secondary: updated.secondaryColor,
    secondaryForeground: updated.secondaryForeground,
    accent: updated.accentColor,
    accentForeground: updated.accentForeground,
    sidebarPrimary: updated.sidebarPrimary,
    sidebarPrimaryForeground: updated.sidebarPrimaryForeground,
  };
}

export const studentService = {
  async list() {
    const records = await prisma.student.findMany({
      include: {
        user: true,
        class: true,
        section: true,
        parent: { include: { user: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapStudent);
  },

  async get(id: string) {
    const record = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: true,
        section: true,
        parent: { include: { user: true } },
      },
    });

    if (!record) {
      throw new ApiError(404, "Student not found");
    }

    return mapStudent(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const className = getString(data, "class");
    const sectionName = getString(data, "section");
    const classRecord = await findOrCreateClass(className);
    const sectionRecord = await findOrCreateSection(
      classRecord.id,
      sectionName,
    );
    const studentEmail = normalizeEmail(getString(data, "email"));
    const selectedParentId = getString(data, "parentId", {
      required: false,
      defaultValue: "",
    });

    // Check the student email before creating the parent record so we do not
    // create a parent account for a request that will be rejected anyway.
    const existingUser = await prisma.user.findUnique({
      where: { email: studentEmail },
    });
    if (existingUser) {
      throw new ApiError(400, "Email already in use");
    }

    let parentId: string | null = null;
    if (selectedParentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: selectedParentId },
      });

      if (!parent) {
        throw new ApiError(404, "Selected parent not found");
      }

      parentId = parent.id;
    } else if (data.parentName) {
      const parent = await findOrCreateParentByName({
        name: getString(data, "parentName"),
        phone: getString(data, "phone"),
        email: buildParentEmail(studentEmail),
        occupation: getOptionalString(data, "occupation"),
        address: getOptionalString(data, "address"),
      });

      parentId = parent.id;
    }

    const record = await prisma.student.create({
      data: {
        studentId: `S-${Date.now()}`,
        rollNumber: getString(data, "rollNumber"),
        admissionDate: getDateString(data, "admissionDate"),
        status: ACTIVE_STATUS,
        class: { connect: { id: classRecord.id } },
        section: { connect: { id: sectionRecord.id } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        user: {
          create: {
            name: getString(data, "name"),
            email: studentEmail,
            phone: getString(data, "phone"),
            passwordHash: "seeded-password",
            status: ACTIVE_STATUS,
          },
        },
      },
      include: {
        user: true,
        class: true,
        section: true,
        parent: { include: { user: true } },
      },
    });

    return mapStudent(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: true,
        section: true,
        parent: { include: { user: true } },
      },
    });

    if (!current) {
      throw new ApiError(404, "Student not found");
    }

    const data = asRecord(input);
    const nextEmail = normalizeEmail(
      getString(data, "email", {
        required: false,
        defaultValue: current.user.email,
      }),
    );
    const emailOwner = await prisma.user.findFirst({
      where: {
        email: nextEmail,
        NOT: { id: current.user.id },
      },
    });
    if (emailOwner) {
      throw new ApiError(400, "Email already in use");
    }

    const className = getString(data, "class", {
      required: false,
      defaultValue: current.class.name,
    });
    const classRecord = await findOrCreateClass(className);
    const sectionName = getString(data, "section", {
      required: false,
      defaultValue: current.section?.name ?? "A",
    });
    const sectionRecord = await findOrCreateSection(
      classRecord.id,
      sectionName,
    );

    let parentId = current.parentId;
    if (data.parentId !== undefined) {
      const nextParentId = getString(data, "parentId", {
        required: false,
        defaultValue: current.parentId ?? "",
      });

      if (nextParentId) {
        const parent = await prisma.parent.findUnique({
          where: { id: nextParentId },
        });

        if (!parent) {
          throw new ApiError(404, "Selected parent not found");
        }

        parentId = parent.id;
      } else {
        parentId = null;
      }
    } else if (data.parentName || data.phone || data.parentEmail) {
      const parent = await findOrCreateParentByName({
        name: getString(data, "parentName", {
          required: false,
          defaultValue: current.parent?.user.name ?? "",
        }),
        phone: getString(data, "phone", {
          required: false,
          defaultValue: current.user.phone ?? "",
        }),
        email: getString(data, "parentEmail", {
          required: false,
          defaultValue:
            current.parent?.user.email ?? `${current.user.email}.parent`,
        }),
        occupation:
          getOptionalString(data, "occupation") ??
          current.parent?.occupation ??
          null,
        address:
          getOptionalString(data, "address") ?? current.parent?.address ?? null,
      });
      parentId = parent.id;
    }

    const record = await prisma.student.update({
      where: { id },
      data: {
        rollNumber: getString(data, "rollNumber", {
          required: false,
          defaultValue: current.rollNumber,
        }),
        admissionDate: getDateString(
          data,
          "admissionDate",
          current.admissionDate ?? new Date(),
        ),
        status: toUserStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        class: { connect: { id: classRecord.id } },
        section: { connect: { id: sectionRecord.id } },
        parent: parentId ? { connect: { id: parentId } } : { disconnect: true },
        user: {
          update: {
            name: getString(data, "name", {
              required: false,
              defaultValue: current.user.name,
            }),
            email: nextEmail,
            phone: getString(data, "phone", {
              required: false,
              defaultValue: current.user.phone ?? "",
            }),
          },
        },
      },
      include: {
        user: true,
        class: true,
        section: true,
        parent: { include: { user: true } },
      },
    });

    return mapStudent(record);
  },

  async remove(id: string) {
    await prisma.student.delete({ where: { id } });
  },
};

export const teacherService = {
  async list() {
    const records = await prisma.teacher.findMany({
      include: { user: true, subjects: true },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapTeacher);
  },

  async get(id: string) {
    const record = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, subjects: true },
    });

    if (!record) {
      throw new ApiError(404, "Teacher not found");
    }

    return mapTeacher(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const record = await prisma.teacher.create({
      data: {
        teacherId: `T-${Date.now()}`,
        qualification: getString(data, "qualification"),
        joiningDate: getDateString(data, "joinDate"),
        status: ACTIVE_STATUS,
        user: {
          create: {
            name: getString(data, "name"),
            email: getString(data, "email"),
            phone: getString(data, "phone"),
            passwordHash: "seeded-password",
            status: ACTIVE_STATUS,
          },
        },
      },
      include: { user: true, subjects: true },
    });

    const subjectName = getString(data, "subject", {
      required: false,
      defaultValue: "",
    });
    const classRecord = await findOrCreateClass(
      getString(data, "class", { required: false, defaultValue: "General" }),
    );
    if (subjectName) {
      await findOrCreateSubject(subjectName, classRecord.id, record.id);
    }

    const refreshed = await prisma.teacher.findUnique({
      where: { id: record.id },
      include: { user: true, subjects: true },
    });

    if (!refreshed) {
      throw new ApiError(500, "Teacher could not be loaded after creation");
    }

    return mapTeacher(refreshed);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, subjects: true },
    });

    if (!current) {
      throw new ApiError(404, "Teacher not found");
    }

    const data = asRecord(input);
    await prisma.teacher.update({
      where: { id },
      data: {
        qualification: getString(data, "qualification", {
          required: false,
          defaultValue: current.qualification ?? "",
        }),
        joiningDate: getDateString(
          data,
          "joinDate",
          current.joiningDate ?? new Date(),
        ),
        status: toUserStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        user: {
          update: {
            name: getString(data, "name", {
              required: false,
              defaultValue: current.user.name,
            }),
            email: getString(data, "email", {
              required: false,
              defaultValue: current.user.email,
            }),
            phone: getString(data, "phone", {
              required: false,
              defaultValue: current.user.phone ?? "",
            }),
          },
        },
      },
    });

    const subjectName = getString(data, "subject", {
      required: false,
      defaultValue: current.subjects[0]?.name ?? "",
    });
    const classRecord = await findOrCreateClass(
      getString(data, "class", { required: false, defaultValue: "General" }),
    );
    if (subjectName) {
      await findOrCreateSubject(subjectName, classRecord.id, id);
    }

    const refreshed = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true, subjects: true },
    });

    if (!refreshed) {
      throw new ApiError(500, "Teacher could not be loaded after update");
    }

    return mapTeacher(refreshed);
  },

  async remove(id: string) {
    await prisma.teacher.delete({ where: { id } });
  },
};

export const staffService = {
  async list() {
    const records = await prisma.staff.findMany({
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapStaff);
  },

  async get(id: string) {
    const record = await prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record) {
      throw new ApiError(404, "Staff not found");
    }

    return mapStaff(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const record = await prisma.staff.create({
      data: {
        staffId: `ST-${Date.now()}`,
        position: getString(data, "position"),
        department: getString(data, "department"),
        joiningDate: getDateString(data, "joinDate"),
        status: ACTIVE_STATUS,
        user: {
          create: {
            name: getString(data, "name"),
            email: getString(data, "email"),
            phone: getString(data, "phone"),
            passwordHash: "seeded-password",
            status: ACTIVE_STATUS,
          },
        },
      },
      include: { user: true },
    });

    return mapStaff(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.staff.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!current) {
      throw new ApiError(404, "Staff not found");
    }

    const data = asRecord(input);
    const record = await prisma.staff.update({
      where: { id },
      data: {
        position: getString(data, "position", {
          required: false,
          defaultValue: current.position ?? "",
        }),
        department: getString(data, "department", {
          required: false,
          defaultValue: current.department ?? "",
        }),
        joiningDate: getDateString(
          data,
          "joinDate",
          current.joiningDate ?? new Date(),
        ),
        status: toUserStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        user: {
          update: {
            name: getString(data, "name", {
              required: false,
              defaultValue: current.user.name,
            }),
            email: getString(data, "email", {
              required: false,
              defaultValue: current.user.email,
            }),
            phone: getString(data, "phone", {
              required: false,
              defaultValue: current.user.phone ?? "",
            }),
          },
        },
      },
      include: { user: true },
    });

    return mapStaff(record);
  },

  async remove(id: string) {
    await prisma.staff.delete({ where: { id } });
  },
};

export const parentService = {
  async list() {
    const records = await prisma.parent.findMany({
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapParent);
  },

  async get(id: string) {
    const record = await prisma.parent.findUnique({
      where: { id },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (!record) {
      throw new ApiError(404, "Parent not found");
    }

    return mapParent(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const studentIds = getStringArray(data, "studentIds") ?? [];
    const email = normalizeEmail(getString(data, "email"));
    const existingParent = await prisma.parent.findFirst({
      where: { user: { email } },
      select: { id: true },
    });

    if (existingParent) {
      throw new ApiError(400, "Parent email already exists");
    }

    const record = await findOrCreateParentByName({
      name: getString(data, "name"),
      phone: getString(data, "phone"),
      email,
      occupation: getOptionalString(data, "occupation"),
      address: getOptionalString(data, "address"),
    });

    await syncParentStudents(record.id, studentIds);

    const refreshed = await prisma.parent.findUnique({
      where: { id: record.id },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (!refreshed) {
      throw new ApiError(404, "Parent not found");
    }

    return mapParent(refreshed);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.parent.findUnique({
      where: { id },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (!current) {
      throw new ApiError(404, "Parent not found");
    }

    const data = asRecord(input);
    const studentIds = getStringArray(data, "studentIds");
    const nextEmail = normalizeEmail(
      getString(data, "email", {
        required: false,
        defaultValue: current.user.email,
      }),
    );
    const emailOwner = await prisma.user.findFirst({
      where: {
        email: nextEmail,
        NOT: { id: current.userId },
      },
      select: { id: true },
    });

    if (emailOwner) {
      throw new ApiError(400, "Parent email already exists");
    }

    await prisma.parent.update({
      where: { id },
      data: {
        occupation: getString(data, "occupation", {
          required: false,
          defaultValue: current.occupation ?? "",
        }),
        address: getString(data, "address", {
          required: false,
          defaultValue: current.address ?? "",
        }),
        user: {
          update: {
            name: getString(data, "name", {
              required: false,
              defaultValue: current.user.name,
            }),
            email: nextEmail,
            phone: getString(data, "phone", {
              required: false,
              defaultValue: current.user.phone ?? "",
            }),
          },
        },
      },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (studentIds) {
      await syncParentStudents(id, studentIds);
    }

    const refreshed = await prisma.parent.findUnique({
      where: { id },
      include: {
        user: true,
        students: {
          include: {
            user: true,
            class: true,
            section: true,
          },
        },
      },
    });

    if (!refreshed) {
      throw new ApiError(404, "Parent not found");
    }

    return mapParent(refreshed);
  },

  async remove(id: string) {
    const linkedStudents = await prisma.student.count({
      where: { parentId: id },
    });

    if (linkedStudents > 0) {
      throw new ApiError(
        400,
        "Cannot delete a parent while students are still linked. Reassign or remove the children first",
      );
    }

    await prisma.parent.delete({ where: { id } });
  },
};

export const classService = {
  async list() {
    const records = await prisma.class.findMany({
      include: {
        classTeacher: { include: { user: true } },
        sections: {
          include: {
            classTeacher: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return records.flatMap(mapClass);
  },

  async get(id: string) {
    const record = await prisma.section.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            classTeacher: { include: { user: true } },
            sections: true,
          },
        },
        classTeacher: { include: { user: true } },
      },
    });

    if (!record) {
      throw new ApiError(404, "Class not found");
    }

    return {
      id: record.id,
      name: record.class.name,
      capacity: record.class.capacity ?? 0,
      classTeacher:
        record.classTeacher?.user.name ?? record.class.classTeacher?.user.name ?? "",
      room: record.class.room ?? "",
      section: record.name,
    };
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const teacherName = getString(data, "classTeacher", {
      required: false,
      defaultValue: "",
    });
    const teacher = teacherName
      ? await findOrCreateTeacherByName(teacherName)
      : null;
    const classRecord = await findOrCreateClass(getString(data, "name"), {
      capacity: getNumber(data, "capacity", {
        required: false,
        defaultValue: 40,
      }),
      room: getString(data, "room", { required: false, defaultValue: "" }),
    });
    const section = await findOrCreateSection(
      classRecord.id,
      getString(data, "section"),
      { classTeacherId: teacher?.id ?? null },
    );

    return {
      id: section.id,
      name: classRecord.name,
      capacity: classRecord.capacity ?? 0,
      classTeacher: teacher?.user.name ?? "",
      room: classRecord.room ?? "",
      section: section.name,
    };
  },

  async update(id: string, input: unknown) {
    const currentSection = await prisma.section.findUnique({
      where: { id },
      include: {
        class: true,
        classTeacher: { include: { user: true } },
      },
    });

    if (!currentSection) {
      throw new ApiError(404, "Class not found");
    }

    const data = asRecord(input);
    const teacherName = getString(data, "classTeacher", {
      required: false,
      defaultValue: currentSection.classTeacher?.user.name ?? "",
    });
    const teacher = teacherName
      ? await findOrCreateTeacherByName(teacherName)
      : null;

    const classRecord = await prisma.class.update({
      where: { id: currentSection.classId },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: currentSection.class.name,
        }),
        capacity: getNumber(data, "capacity", {
          required: false,
          defaultValue: currentSection.class.capacity ?? 0,
        }),
        room: getString(data, "room", {
          required: false,
          defaultValue: currentSection.class.room ?? "",
        }),
      },
    });

    const section = await prisma.section.update({
      where: { id },
      data: {
        name: getString(data, "section", {
          required: false,
          defaultValue: currentSection.name,
        }),
        classTeacherId: teacher?.id ?? null,
      },
      include: {
        classTeacher: { include: { user: true } },
      },
    });

    return {
      id: section.id,
      name: classRecord.name,
      capacity: classRecord.capacity ?? 0,
      classTeacher: section.classTeacher?.user.name ?? "",
      room: classRecord.room ?? "",
      section: section.name,
    };
  },

  async remove(id: string) {
    await prisma.section.delete({ where: { id } });
  },
};

export const sectionService = {
  async list() {
    const records = await prisma.section.findMany({
      include: { class: true },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapSection);
  },

  async get(id: string) {
    const record = await prisma.section.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!record) {
      throw new ApiError(404, "Section not found");
    }

    return mapSection(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const section = await findOrCreateSection(
      classRecord.id,
      getString(data, "name"),
    );
    return {
      id: section.id,
      name: section.name,
      class: classRecord.name,
    };
  },

  async update(id: string, input: unknown) {
    const current = await prisma.section.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!current) {
      throw new ApiError(404, "Section not found");
    }

    const data = asRecord(input);
    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const record = await prisma.section.update({
      where: { id },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: current.name,
        }),
        classId: classRecord.id,
      },
      include: { class: true },
    });

    return mapSection(record);
  },

  async remove(id: string) {
    await prisma.section.delete({ where: { id } });
  },
};

export const subjectService = {
  async list() {
    const records = await prisma.subject.findMany({
      include: { class: true, teacher: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapSubject);
  },

  async get(id: string) {
    const record = await prisma.subject.findUnique({
      where: { id },
      include: { class: true, teacher: { include: { user: true } } },
    });

    if (!record) {
      throw new ApiError(404, "Subject not found");
    }

    return mapSubject(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const teacherName = getString(data, "teacher", {
      required: false,
      defaultValue: "",
    });
    const teacher = teacherName
      ? await findOrCreateTeacherByName(teacherName)
      : null;
    const record = await prisma.subject.create({
      data: {
        name: getString(data, "name"),
        code: getString(data, "code", { required: false, defaultValue: "" }),
        classId: classRecord.id,
        teacherId: teacher?.id ?? null,
      },
      include: { class: true, teacher: { include: { user: true } } },
    });

    return mapSubject(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.subject.findUnique({
      where: { id },
      include: { class: true, teacher: { include: { user: true } } },
    });

    if (!current) {
      throw new ApiError(404, "Subject not found");
    }

    const data = asRecord(input);
    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const teacherName = getString(data, "teacher", {
      required: false,
      defaultValue: current.teacher?.user.name ?? "",
    });
    const teacher = teacherName
      ? await findOrCreateTeacherByName(teacherName)
      : null;
    const record = await prisma.subject.update({
      where: { id },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: current.name,
        }),
        code: getString(data, "code", {
          required: false,
          defaultValue: current.code ?? "",
        }),
        classId: classRecord.id,
        teacherId: teacher?.id ?? null,
      },
      include: { class: true, teacher: { include: { user: true } } },
    });

    return mapSubject(record);
  },

  async remove(id: string) {
    await prisma.subject.delete({ where: { id } });
  },
};

export const attendanceService = {
  async list() {
    const records = await prisma.attendance.findMany({
      include: { student: true },
      orderBy: { date: "desc" },
    });

    return records.map(mapAttendance);
  },

  async get(id: string) {
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!record) {
      throw new ApiError(404, "Attendance not found");
    }

    return mapAttendance(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const student = await prisma.student.findFirst({
      where: { studentId: getString(data, "studentId") },
    });

    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    const record = await prisma.attendance.create({
      data: {
        studentId: student.id,
        date: getDateString(data, "date"),
        status: toAttendanceStatus(getString(data, "status")),
      },
      include: { student: true },
    });

    return mapAttendance(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.attendance.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!current) {
      throw new ApiError(404, "Attendance not found");
    }

    const data = asRecord(input);
    const studentId = getString(data, "studentId", {
      required: false,
      defaultValue: current.student?.studentId ?? "",
    });
    const student = await prisma.student.findFirst({ where: { studentId } });

    const record = await prisma.attendance.update({
      where: { id },
      data: {
        studentId: student?.id ?? current.studentId,
        date: getDateString(data, "date", current.date),
        status: toAttendanceStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
      },
      include: { student: true },
    });

    return mapAttendance(record);
  },

  async remove(id: string) {
    await prisma.attendance.delete({ where: { id } });
  },
};

export const examService = {
  async list() {
    const records = await prisma.exam.findMany({
      include: { class: true, subject: true },
      orderBy: { startDate: "asc" },
    });

    return records.map(mapExam);
  },

  async get(id: string) {
    const record = await prisma.exam.findUnique({
      where: { id },
      include: { class: true, subject: true },
    });

    if (!record) {
      throw new ApiError(404, "Exam not found");
    }

    return mapExam(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const subjectName = getString(data, "subject", {
      required: false,
      defaultValue: "",
    });
    const subject = subjectName
      ? await findOrCreateSubject(subjectName, classRecord.id)
      : null;
    const date = getDateString(data, "date");
    const record = await prisma.exam.create({
      data: {
        title: getString(data, "name"),
        classId: classRecord.id,
        subjectId: subject?.id ?? null,
        startDate: date,
        endDate: date,
        totalMarks: getNumber(data, "totalMarks"),
        status: "PUBLISHED",
      },
      include: { class: true, subject: true },
    });

    return mapExam(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.exam.findUnique({
      where: { id },
      include: { class: true, subject: true },
    });

    if (!current) {
      throw new ApiError(404, "Exam not found");
    }

    const data = asRecord(input);
    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const subjectName = getString(data, "subject", {
      required: false,
      defaultValue: current.subject?.name ?? "",
    });
    const subject = subjectName
      ? await findOrCreateSubject(subjectName, classRecord.id)
      : null;
    const date = getDateString(data, "date", current.startDate);
    const record = await prisma.exam.update({
      where: { id },
      data: {
        title: getString(data, "name", {
          required: false,
          defaultValue: current.title,
        }),
        classId: classRecord.id,
        subjectId: subject?.id ?? null,
        startDate: date,
        endDate: date,
        totalMarks: getNumber(data, "totalMarks", {
          required: false,
          defaultValue: current.totalMarks,
        }),
      },
      include: { class: true, subject: true },
    });

    return mapExam(record);
  },

  async remove(id: string) {
    await prisma.exam.delete({ where: { id } });
  },
};

export const resultService = {
  async list() {
    const records = await prisma.result.findMany({
      include: { exam: true, student: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    });

    return records.map(mapResult);
  },

  async get(id: string) {
    const record = await prisma.result.findUnique({
      where: { id },
      include: { exam: true, student: { include: { user: true } } },
    });

    if (!record) {
      throw new ApiError(404, "Result not found");
    }

    return mapResult(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const exam = await prisma.exam.findFirst({
      where: { title: getString(data, "exam") },
    });
    const student = await prisma.student.findFirst({
      where: { user: { name: getString(data, "student") } },
      include: { user: true },
    });

    if (!exam || !student) {
      throw new ApiError(404, "Exam or student not found");
    }

    const record = await prisma.result.create({
      data: {
        examId: exam.id,
        studentId: student.id,
        totalMarks: getNumber(data, "totalMarks"),
        grade: getString(data, "grade", { required: false, defaultValue: "" }),
        gpa: getNumber(data, "gpa", { required: false, defaultValue: 0 }),
        position: getNumber(data, "position", {
          required: false,
          defaultValue: 0,
        }),
        isPublished: getBoolean(data, "isPublished"),
      },
      include: { exam: true, student: { include: { user: true } } },
    });

    return mapResult(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.result.findUnique({
      where: { id },
      include: { exam: true, student: { include: { user: true } } },
    });

    if (!current) {
      throw new ApiError(404, "Result not found");
    }

    const data = asRecord(input);
    const record = await prisma.result.update({
      where: { id },
      data: {
        totalMarks: getNumber(data, "totalMarks", {
          required: false,
          defaultValue: current.totalMarks,
        }),
        grade: getString(data, "grade", {
          required: false,
          defaultValue: current.grade ?? "",
        }),
        gpa: getNumber(data, "gpa", {
          required: false,
          defaultValue: current.gpa ?? 0,
        }),
        position: getNumber(data, "position", {
          required: false,
          defaultValue: current.position ?? 0,
        }),
        isPublished: getBoolean(data, "isPublished", current.isPublished),
      },
      include: { exam: true, student: { include: { user: true } } },
    });

    return mapResult(record);
  },

  async remove(id: string) {
    await prisma.result.delete({ where: { id } });
  },
};

export const feeService = {
  async list() {
    const records = await prisma.fee.findMany({
      include: { student: true },
      orderBy: { dueDate: "asc" },
    });

    return records.map(mapFee);
  },

  async get(id: string) {
    const record = await prisma.fee.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!record) {
      throw new ApiError(404, "Fee not found");
    }

    return mapFee(record);
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const student = await prisma.student.findFirst({
      where: { studentId: getString(data, "studentId") },
    });

    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    const record = await prisma.fee.create({
      data: {
        studentId: student.id,
        amount: getNumber(data, "amount"),
        dueDate: getDateString(data, "dueDate"),
        status: toFeeStatus(
          getString(data, "status", {
            required: false,
            defaultValue: "pending",
          }),
        ),
        month: getString(data, "month"),
        title: getString(data, "title", {
          required: false,
          defaultValue: "Monthly Fee",
        }),
      },
      include: { student: true },
    });

    return mapFee(record);
  },

  async update(id: string, input: unknown) {
    const current = await prisma.fee.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!current) {
      throw new ApiError(404, "Fee not found");
    }

    const data = asRecord(input);
    const studentCode = getString(data, "studentId", {
      required: false,
      defaultValue: current.student.studentId,
    });
    const student = await prisma.student.findFirst({
      where: { studentId: studentCode },
    });
    if (!student) {
      throw new ApiError(404, "Student not found");
    }

    const record = await prisma.fee.update({
      where: { id },
      data: {
        studentId: student.id,
        amount: getNumber(data, "amount", {
          required: false,
          defaultValue: current.amount,
        }),
        dueDate: getDateString(data, "dueDate", current.dueDate ?? new Date()),
        status: toFeeStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        month: getString(data, "month", {
          required: false,
          defaultValue: current.month,
        }),
        title: getString(data, "title", {
          required: false,
          defaultValue: current.title,
        }),
      },
      include: { student: true },
    });

    return mapFee(record);
  },

  async remove(id: string) {
    await prisma.fee.delete({ where: { id } });
  },
};

function simpleCrud<TOutput>(options: {
  resourceName: string;
  list: () => Promise<TOutput[]>;
  get: (id: string) => Promise<TOutput | null>;
  create: (input: RecordValue) => Promise<TOutput>;
  update: (id: string, input: RecordValue) => Promise<TOutput>;
  remove: (id: string) => Promise<void>;
}) {
  return {
    async list() {
      return options.list();
    },
    async get(id: string) {
      const record = await options.get(id);
      if (!record) {
        throw new ApiError(404, `${options.resourceName} not found`);
      }
      return record;
    },
    async create(input: unknown) {
      return options.create(asRecord(input));
    },
    async update(id: string, input: unknown) {
      return options.update(id, asRecord(input));
    },
    async remove(id: string) {
      await options.remove(id);
    },
  };
}

export const accountService = simpleCrud<AccountTransaction>({
  resourceName: "Account transaction",
  list: async () =>
    (
      await prisma.accountTransaction.findMany({ orderBy: { date: "desc" } })
    ).map(mapAccount),
  get: async (id) => {
    const record = await prisma.accountTransaction.findUnique({
      where: { id },
    });
    return record ? mapAccount(record) : null;
  },
  create: async (data) => {
    const record = await prisma.accountTransaction.create({
      data: {
        title: getString(data, "title"),
        type: toTransactionType(getString(data, "type")),
        amount: getNumber(data, "amount"),
        category: getString(data, "category"),
        date: getDateString(data, "date"),
        note: getString(data, "note", { required: false, defaultValue: "" }),
      },
    });
    return mapAccount(record);
  },
  update: async (id, data) => {
    const current = await prisma.accountTransaction.findUnique({
      where: { id },
    });
    if (!current) {
      throw new ApiError(404, "Account transaction not found");
    }
    const record = await prisma.accountTransaction.update({
      where: { id },
      data: {
        title: getString(data, "title", {
          required: false,
          defaultValue: current.title,
        }),
        type: toTransactionType(
          getString(data, "type", {
            required: false,
            defaultValue: current.type.toLowerCase(),
          }),
        ),
        amount: getNumber(data, "amount", {
          required: false,
          defaultValue: current.amount,
        }),
        category: getString(data, "category", {
          required: false,
          defaultValue: current.category,
        }),
        date: getDateString(data, "date", current.date),
        note: getString(data, "note", {
          required: false,
          defaultValue: current.note ?? "",
        }),
      },
    });
    return mapAccount(record);
  },
  remove: async (id) => {
    await prisma.accountTransaction.delete({ where: { id } });
  },
});

export const payrollService = simpleCrud<Payroll>({
  resourceName: "Payroll",
  list: async () =>
    (await prisma.payroll.findMany({ orderBy: { createdAt: "desc" } })).map(
      mapPayroll,
    ),
  get: async (id) => {
    const record = await prisma.payroll.findUnique({ where: { id } });
    return record ? mapPayroll(record) : null;
  },
  create: async (data) => {
    const record = await prisma.payroll.create({
      data: {
        employeeName: getString(data, "employeeName"),
        employeeType: toEmployeeType(getString(data, "employeeType")),
        month: getString(data, "month"),
        amount: getNumber(data, "amount"),
        status: toPayrollStatus(
          getString(data, "status", {
            required: false,
            defaultValue: "pending",
          }),
        ),
        paidDate: getDateString(data, "paidDate"),
      },
    });
    return mapPayroll(record);
  },
  update: async (id, data) => {
    const current = await prisma.payroll.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Payroll not found");
    }
    const record = await prisma.payroll.update({
      where: { id },
      data: {
        employeeName: getString(data, "employeeName", {
          required: false,
          defaultValue: current.employeeName,
        }),
        employeeType: toEmployeeType(
          getString(data, "employeeType", {
            required: false,
            defaultValue: current.employeeType.toLowerCase(),
          }),
        ),
        month: getString(data, "month", {
          required: false,
          defaultValue: current.month,
        }),
        amount: getNumber(data, "amount", {
          required: false,
          defaultValue: current.amount,
        }),
        status: toPayrollStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        paidDate: getDateString(
          data,
          "paidDate",
          current.paidDate ?? new Date(),
        ),
      },
    });
    return mapPayroll(record);
  },
  remove: async (id) => {
    await prisma.payroll.delete({ where: { id } });
  },
});

export const inventoryService = simpleCrud<Inventory>({
  resourceName: "Inventory item",
  list: async () =>
    (await prisma.inventory.findMany({ orderBy: { createdAt: "desc" } })).map(
      mapInventory,
    ),
  get: async (id) => {
    const record = await prisma.inventory.findUnique({ where: { id } });
    return record ? mapInventory(record) : null;
  },
  create: async (data) => {
    const record = await prisma.inventory.create({
      data: {
        name: getString(data, "name"),
        quantity: getNumber(data, "quantity"),
        unit: getString(data, "unit", { required: false, defaultValue: "" }),
        price: getNumber(data, "price", { required: false, defaultValue: 0 }),
        note: getString(data, "note", { required: false, defaultValue: "" }),
      },
    });
    return mapInventory(record);
  },
  update: async (id, data) => {
    const current = await prisma.inventory.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Inventory item not found");
    }
    const record = await prisma.inventory.update({
      where: { id },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: current.name,
        }),
        quantity: getNumber(data, "quantity", {
          required: false,
          defaultValue: current.quantity,
        }),
        unit: getString(data, "unit", {
          required: false,
          defaultValue: current.unit ?? "",
        }),
        price: getNumber(data, "price", {
          required: false,
          defaultValue: current.price ?? 0,
        }),
        note: getString(data, "note", {
          required: false,
          defaultValue: current.note ?? "",
        }),
      },
    });
    return mapInventory(record);
  },
  remove: async (id) => {
    await prisma.inventory.delete({ where: { id } });
  },
});

export const transportService = simpleCrud<Transport>({
  resourceName: "Transport route",
  list: async () =>
    (await prisma.transport.findMany({ orderBy: { createdAt: "desc" } })).map(
      mapTransport,
    ),
  get: async (id) => {
    const record = await prisma.transport.findUnique({ where: { id } });
    return record ? mapTransport(record) : null;
  },
  create: async (data) => {
    const record = await prisma.transport.create({
      data: {
        routeName: getString(data, "routeName"),
        vehicleNo: getString(data, "vehicleNo"),
        driverName: getString(data, "driverName", {
          required: false,
          defaultValue: "",
        }),
        driverPhone: getString(data, "driverPhone", {
          required: false,
          defaultValue: "",
        }),
        fee: getNumber(data, "fee", { required: false, defaultValue: 0 }),
      },
    });
    return mapTransport(record);
  },
  update: async (id, data) => {
    const current = await prisma.transport.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Transport route not found");
    }
    const record = await prisma.transport.update({
      where: { id },
      data: {
        routeName: getString(data, "routeName", {
          required: false,
          defaultValue: current.routeName,
        }),
        vehicleNo: getString(data, "vehicleNo", {
          required: false,
          defaultValue: current.vehicleNo,
        }),
        driverName: getString(data, "driverName", {
          required: false,
          defaultValue: current.driverName ?? "",
        }),
        driverPhone: getString(data, "driverPhone", {
          required: false,
          defaultValue: current.driverPhone ?? "",
        }),
        fee: getNumber(data, "fee", {
          required: false,
          defaultValue: current.fee ?? 0,
        }),
      },
    });
    return mapTransport(record);
  },
  remove: async (id) => {
    await prisma.transport.delete({ where: { id } });
  },
});

export const homeworkService = simpleCrud<Homework>({
  resourceName: "Homework",
  list: async () =>
    (
      await prisma.homework.findMany({
        include: { class: true, subject: true },
        orderBy: { dueDate: "asc" },
      })
    ).map(mapHomework),
  get: async (id) => {
    const record = await prisma.homework.findUnique({
      where: { id },
      include: { class: true, subject: true },
    });
    return record ? mapHomework(record) : null;
  },
  create: async (data) => {
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const subject = await findOrCreateSubject(
      getString(data, "subject"),
      classRecord.id,
    );
    const record = await prisma.homework.create({
      data: {
        title: getString(data, "title"),
        description: getString(data, "description", {
          required: false,
          defaultValue: "",
        }),
        classId: classRecord.id,
        subjectId: subject.id,
        dueDate: getDateString(data, "dueDate"),
      },
      include: { class: true, subject: true },
    });
    return mapHomework(record);
  },
  update: async (id, data) => {
    const current = await prisma.homework.findUnique({
      where: { id },
      include: { class: true, subject: true },
    });
    if (!current) {
      throw new ApiError(404, "Homework not found");
    }
    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const subject = await findOrCreateSubject(
      getString(data, "subject", {
        required: false,
        defaultValue: current.subject.name,
      }),
      classRecord.id,
    );
    const record = await prisma.homework.update({
      where: { id },
      data: {
        title: getString(data, "title", {
          required: false,
          defaultValue: current.title,
        }),
        description: getString(data, "description", {
          required: false,
          defaultValue: current.description ?? "",
        }),
        classId: classRecord.id,
        subjectId: subject.id,
        dueDate: getDateString(data, "dueDate", current.dueDate ?? new Date()),
      },
      include: { class: true, subject: true },
    });
    return mapHomework(record);
  },
  remove: async (id) => {
    await prisma.homework.delete({ where: { id } });
  },
});

export const lessonPlanService = simpleCrud<LessonPlan>({
  resourceName: "Lesson plan",
  list: async () =>
    (
      await prisma.lessonPlan.findMany({
        include: {
          class: true,
          subject: true,
          teacher: { include: { user: true } },
        },
        orderBy: { date: "asc" },
      })
    ).map(mapLessonPlan),
  get: async (id) => {
    const record = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
    });
    return record ? mapLessonPlan(record) : null;
  },
  create: async (data) => {
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const teacher = await findOrCreateTeacherByName(getString(data, "teacher"));
    const subject = await findOrCreateSubject(
      getString(data, "subject"),
      classRecord.id,
      teacher.id,
    );

    const record = await prisma.lessonPlan.create({
      data: {
        title: getString(data, "title"),
        description: getString(data, "description", {
          required: false,
          defaultValue: "",
        }),
        classId: classRecord.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        date: getDateString(data, "date"),
      },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    return mapLessonPlan(record);
  },
  update: async (id, data) => {
    const current = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    if (!current) {
      throw new ApiError(404, "Lesson plan not found");
    }

    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const teacher = await findOrCreateTeacherByName(
      getString(data, "teacher", {
        required: false,
        defaultValue: current.teacher.user.name,
      }),
    );
    const subject = await findOrCreateSubject(
      getString(data, "subject", {
        required: false,
        defaultValue: current.subject.name,
      }),
      classRecord.id,
      teacher.id,
    );

    const record = await prisma.lessonPlan.update({
      where: { id },
      data: {
        title: getString(data, "title", {
          required: false,
          defaultValue: current.title,
        }),
        description: getString(data, "description", {
          required: false,
          defaultValue: current.description ?? "",
        }),
        classId: classRecord.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        date: getDateString(data, "date", current.date ?? new Date()),
      },
      include: {
        class: true,
        subject: true,
        teacher: { include: { user: true } },
      },
    });

    return mapLessonPlan(record);
  },
  remove: async (id) => {
    await prisma.lessonPlan.delete({ where: { id } });
  },
});

export const lectureService = simpleCrud<Lecture>({
  resourceName: "Lecture",
  list: async () =>
    (
      await prisma.lecture.findMany({
        include: {
          class: true,
          section: true,
          subject: true,
          teacher: { include: { user: true } },
          student: { include: { user: true } },
        },
        orderBy: { date: "asc" },
      })
    ).map(mapLecture),
  get: async (id) => {
    const record = await prisma.lecture.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { include: { user: true } },
        student: { include: { user: true } },
      },
    });
    return record ? mapLecture(record) : null;
  },
  create: async (data) => {
    const classRecord = await findOrCreateClass(getString(data, "class"));
    const sectionName = getString(data, "section", {
      required: false,
      defaultValue: "",
    });
    const section = sectionName
      ? await findOrCreateSection(classRecord.id, sectionName)
      : null;
    const teacher = await findOrCreateTeacherByName(getString(data, "teacher"));
    const subject = await findOrCreateSubject(
      getString(data, "subject"),
      classRecord.id,
      teacher.id,
    );
    const studentName = getString(data, "student", {
      required: false,
      defaultValue: "",
    });
    const student = studentName ? await findStudentByName(studentName) : null;

    const record = await prisma.lecture.create({
      data: {
        title: getString(data, "title"),
        description: getString(data, "description", {
          required: false,
          defaultValue: "",
        }),
        classId: classRecord.id,
        sectionId: section?.id ?? null,
        subjectId: subject.id,
        teacherId: teacher.id,
        studentId: student?.id ?? null,
        date: getDateString(data, "date"),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    return mapLecture(record);
  },
  update: async (id, data) => {
    const current = await prisma.lecture.findUnique({
      where: { id },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    if (!current) {
      throw new ApiError(404, "Lecture not found");
    }

    const classRecord = await findOrCreateClass(
      getString(data, "class", {
        required: false,
        defaultValue: current.class.name,
      }),
    );
    const sectionName = getString(data, "section", {
      required: false,
      defaultValue: current.section?.name ?? "",
    });
    const section = sectionName
      ? await findOrCreateSection(classRecord.id, sectionName)
      : null;
    const teacher = await findOrCreateTeacherByName(
      getString(data, "teacher", {
        required: false,
        defaultValue: current.teacher.user.name,
      }),
    );
    const subject = await findOrCreateSubject(
      getString(data, "subject", {
        required: false,
        defaultValue: current.subject.name,
      }),
      classRecord.id,
      teacher.id,
    );
    const studentName = getString(data, "student", {
      required: false,
      defaultValue: current.student?.user.name ?? "",
    });
    const student = studentName ? await findStudentByName(studentName) : null;

    const record = await prisma.lecture.update({
      where: { id },
      data: {
        title: getString(data, "title", {
          required: false,
          defaultValue: current.title,
        }),
        description: getString(data, "description", {
          required: false,
          defaultValue: current.description ?? "",
        }),
        classId: classRecord.id,
        sectionId: section?.id ?? null,
        subjectId: subject.id,
        teacherId: teacher.id,
        studentId: student?.id ?? null,
        date: getDateString(data, "date", current.date ?? new Date()),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    return mapLecture(record);
  },
  remove: async (id) => {
    await prisma.lecture.delete({ where: { id } });
  },
});

export const smsService = simpleCrud<SmsLog>({
  resourceName: "SMS log",
  list: async () =>
    (await prisma.smsLog.findMany({ orderBy: { createdAt: "desc" } })).map(
      mapSms,
    ),
  get: async (id) => {
    const record = await prisma.smsLog.findUnique({ where: { id } });
    return record ? mapSms(record) : null;
  },
  create: async (data) => {
    const record = await prisma.smsLog.create({
      data: {
        receiver: getString(data, "receiver"),
        message: getString(data, "message"),
        type: getString(data, "type", {
          required: false,
          defaultValue: "general",
        }),
        status: getString(data, "status", {
          required: false,
          defaultValue: "queued",
        }),
      },
    });
    return mapSms(record);
  },
  update: async (id, data) => {
    const current = await prisma.smsLog.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "SMS log not found");
    }
    const record = await prisma.smsLog.update({
      where: { id },
      data: {
        receiver: getString(data, "receiver", {
          required: false,
          defaultValue: current.receiver,
        }),
        message: getString(data, "message", {
          required: false,
          defaultValue: current.message,
        }),
        type: getString(data, "type", {
          required: false,
          defaultValue: current.type,
        }),
        status: getString(data, "status", {
          required: false,
          defaultValue: current.status,
        }),
      },
    });
    return mapSms(record);
  },
  remove: async (id) => {
    await prisma.smsLog.delete({ where: { id } });
  },
});

export const admissionService = simpleCrud<Admission>({
  resourceName: "Admission application",
  list: async () =>
    (
      await prisma.admission.findMany({
        include: {
          class: true,
          parent: { include: { user: true } },
          student: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    ).map(mapAdmission),
  get: async (id) => {
    const record = await prisma.admission.findUnique({
      where: { id },
      include: {
        class: true,
        parent: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    if (!record) {
      throw new ApiError(404, "Admission application not found");
    }

    return mapAdmission(record);
  },
  create: async (input) => {
    const data = asRecord(input);
    const classId = getString(data, "classId");
    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord) {
      throw new ApiError(404, "Selected class not found");
    }

    const parentId = getOptionalString(data, "parentId");
    if (parentId) {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new ApiError(404, "Parent not found");
      }
    }

    const studentId = getOptionalString(data, "studentId");
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        throw new ApiError(404, "Student not found");
      }
    }

    const record = await prisma.admission.create({
      data: {
        studentName: getString(data, "studentName"),
        email: getString(data, "email"),
        phone: getOptionalString(data, "phone"),
        classId: classRecord.id,
        parentId,
        studentId,
        status: toAdmissionStatus(
          getString(data, "status", {
            required: false,
            defaultValue: "pending",
          }),
        ),
        note: getString(data, "note", { required: false, defaultValue: "" }),
      },
      include: {
        class: true,
        parent: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    return mapAdmission(record);
  },
  update: async (id, input) => {
    const current = await prisma.admission.findUnique({
      where: { id },
      include: {
        class: true,
        parent: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    if (!current) {
      throw new ApiError(404, "Admission application not found");
    }

    const data = asRecord(input);
    const classId = getString(data, "classId", {
      required: false,
      defaultValue: current.class?.id ?? "",
    });
    let nextClassId = current.classId;

    if (classId) {
      const classRecord = await prisma.class.findUnique({
        where: { id: classId },
      });
      if (!classRecord) {
        throw new ApiError(404, "Selected class not found");
      }
      nextClassId = classRecord.id;
    }

    const parentId = getOptionalString(data, "parentId");
    if (parentId !== null) {
      if (parentId) {
        const parent = await prisma.parent.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          throw new ApiError(404, "Parent not found");
        }
      }
    }

    const studentId = getOptionalString(data, "studentId");
    if (studentId !== null) {
      if (studentId) {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
        });
        if (!student) {
          throw new ApiError(404, "Student not found");
        }
      }
    }

    const record = await prisma.admission.update({
      where: { id },
      data: {
        studentName: getString(data, "studentName", {
          required: false,
          defaultValue: current.studentName,
        }),
        email: getString(data, "email", {
          required: false,
          defaultValue: current.email,
        }),
        phone: getOptionalString(data, "phone") ?? current.phone,
        classId: nextClassId,
        parentId: parentId !== null ? parentId : current.parentId,
        studentId: studentId !== null ? studentId : current.studentId,
        status: toAdmissionStatus(
          getString(data, "status", {
            required: false,
            defaultValue: current.status.toLowerCase(),
          }),
        ),
        note: getString(data, "note", {
          required: false,
          defaultValue: current.note ?? "",
        }),
      },
      include: {
        class: true,
        parent: { include: { user: true } },
        student: { include: { user: true } },
      },
    });

    return mapAdmission(record);
  },
  remove: async (id) => {
    await prisma.admission.delete({ where: { id } });
  },
});

export const roleService = {
  async list() {
    const records = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description ?? "",
      permissions: record.permissions.map((item) => item.permission.name),
    }));
  },

  async get(id: string) {
    const record = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!record) {
      throw new ApiError(404, "Role not found");
    }

    return {
      id: record.id,
      name: record.name,
      description: record.description ?? "",
      permissions: record.permissions.map((item) => item.permission.name),
    };
  },

  async create(input: unknown) {
    const data = asRecord(input);
    const permissionNames = Array.isArray(data.permissions)
      ? data.permissions.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    const record = await prisma.role.create({
      data: {
        name: getString(data, "name"),
        description: getString(data, "description", {
          required: false,
          defaultValue: "",
        }),
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return {
      id: record.id,
      name: record.name,
      description: record.description ?? "",
      permissions: record.permissions.map((item) => item.permission.name),
    };
  },

  async update(id: string, input: unknown) {
    const current = await prisma.role.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Role not found");
    }

    const data = asRecord(input);
    const permissionNames = Array.isArray(data.permissions)
      ? data.permissions.filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionNames } },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: id } });

    const record = await prisma.role.update({
      where: { id },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: current.name,
        }),
        description: getString(data, "description", {
          required: false,
          defaultValue: current.description ?? "",
        }),
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return {
      id: record.id,
      name: record.name,
      description: record.description ?? "",
      permissions: record.permissions.map((item) => item.permission.name),
    };
  },

  async remove(id: string) {
    await prisma.role.delete({ where: { id } });
  },
};

export const permissionService = simpleCrud<{
  id: string;
  name: string;
  module: string;
  action: string;
  description: string;
}>({
  resourceName: "Permission",
  list: async () =>
    (
      await prisma.permission.findMany({
        orderBy: { name: "asc" },
      })
    ).map((record) => ({
      id: record.id,
      name: record.name,
      module: record.module,
      action: record.action,
      description: record.description ?? "",
    })),
  get: async (id) => {
    const record = await prisma.permission.findUnique({ where: { id } });
    return record
      ? {
          id: record.id,
          name: record.name,
          module: record.module,
          action: record.action,
          description: record.description ?? "",
        }
      : null;
  },
  create: async (data) => {
    const record = await prisma.permission.create({
      data: {
        name: getString(data, "name"),
        module: getString(data, "module"),
        action: getString(data, "action"),
        description: getString(data, "description", {
          required: false,
          defaultValue: "",
        }),
      },
    });
    return {
      id: record.id,
      name: record.name,
      module: record.module,
      action: record.action,
      description: record.description ?? "",
    };
  },
  update: async (id, data) => {
    const current = await prisma.permission.findUnique({ where: { id } });
    if (!current) {
      throw new ApiError(404, "Permission not found");
    }
    const record = await prisma.permission.update({
      where: { id },
      data: {
        name: getString(data, "name", {
          required: false,
          defaultValue: current.name,
        }),
        module: getString(data, "module", {
          required: false,
          defaultValue: current.module,
        }),
        action: getString(data, "action", {
          required: false,
          defaultValue: current.action,
        }),
        description: getString(data, "description", {
          required: false,
          defaultValue: current.description ?? "",
        }),
      },
    });
    return {
      id: record.id,
      name: record.name,
      module: record.module,
      action: record.action,
      description: record.description ?? "",
    };
  },
  remove: async (id) => {
    await prisma.permission.delete({ where: { id } });
  },
});

export async function getDashboardStats() {
  const [
    totalStudents,
    totalTeachers,
    totalStaff,
    totalClasses,
    pendingFees,
    feeAggregate,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.staff.count(),
    prisma.class.count(),
    prisma.fee.count({ where: { status: "PENDING" } }),
    prisma.fee.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    totalStudents,
    totalTeachers,
    totalStaff,
    totalClasses,
    totalFeesPending: pendingFees,
    totalFeesAmount: feeAggregate._sum.amount ?? 0,
    activeStudents: totalStudents,
  };
}
