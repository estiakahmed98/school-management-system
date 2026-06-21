'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BookOpenText,
  CalendarClock,
  CalendarRange,
  Clapperboard,
  Layers3,
  MonitorPlay,
  Plus,
  RefreshCw,
  Search,
  Shapes,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { DataTable, type ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Class, Lecture, Section, Student, Subject, Teacher } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type LectureFormValues = {
  title: string
  description: string
  class: string
  section: string
  subject: string
  teacher: string
  student: string
  date: string
}

const emptyForm: LectureFormValues = {
  title: '',
  description: '',
  class: '',
  section: '',
  subject: '',
  teacher: '',
  student: '',
  date: '',
}

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<LectureFormValues>(emptyForm)

  useEffect(() => {
    void fetchPageData()
  }, [])

  const filteredLectures = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return lectures.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'upcoming' && isUpcomingDate(item.date)) ||
        (activeTab === 'today' && isSameDay(item.date, new Date())) ||
        (activeTab === 'classWide' && !item.student.trim()) ||
        (activeTab === 'studentSpecific' && Boolean(item.student.trim()))

      if (!matchesTab) return false
      if (!term) return true

      return [item.title, item.class, item.section, item.subject, item.teacher, item.student, item.description, item.date]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, lectures, searchTerm])

  const stats = useMemo(() => {
    const uniqueClasses = new Set(lectures.map(item => item.class).filter(Boolean)).size
    const uniqueTeachers = new Set(lectures.map(item => item.teacher).filter(Boolean)).size
    const dueThisWeek = lectures.filter(item => isWithinDays(item.date, 7)).length
    const studentSpecific = lectures.filter(item => item.student.trim()).length

    return {
      total: lectures.length,
      uniqueClasses,
      uniqueTeachers,
      dueThisWeek,
      studentSpecific,
    }
  }, [lectures])

  const upcomingLectures = useMemo(
    () =>
      [...lectures]
        .filter(item => isUpcomingDate(item.date))
        .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
        .slice(0, 5),
    [lectures]
  )

  const teacherLoad = useMemo(() => {
    const summary = new Map<string, number>()
    for (const item of lectures) {
      summary.set(item.teacher, (summary.get(item.teacher) ?? 0) + 1)
    }
    return [...summary.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [lectures])

  const classCoverage = useMemo(() => {
    const summary = new Map<string, number>()
    for (const item of lectures) {
      summary.set(item.class, (summary.get(item.class) ?? 0) + 1)
    }
    return [...summary.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [lectures])

  const fetchPageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [lectureRes, classRes, sectionRes, subjectRes, teacherRes, studentRes] = await Promise.all([
        fetch('/api/lectures', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/sections', { cache: 'no-store' }),
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ])

      const [lectureData, classData, sectionData, subjectData, teacherData, studentData] = await Promise.all([
        lectureRes.json(),
        classRes.json(),
        sectionRes.json(),
        subjectRes.json(),
        teacherRes.json(),
        studentRes.json(),
      ])

      if (!lectureRes.ok || !lectureData.success) throw new Error(lectureData.message || 'Failed to load lectures')
      if (!classRes.ok || !classData.success) throw new Error(classData.message || 'Failed to load classes')
      if (!sectionRes.ok || !sectionData.success) throw new Error(sectionData.message || 'Failed to load sections')
      if (!subjectRes.ok || !subjectData.success) throw new Error(subjectData.message || 'Failed to load subjects')
      if (!teacherRes.ok || !teacherData.success) throw new Error(teacherData.message || 'Failed to load teachers')
      if (!studentRes.ok || !studentData.success) throw new Error(studentData.message || 'Failed to load students')

      setLectures(lectureData.data)
      setClasses(classData.data)
      setSections(sectionData.data)
      setSubjects(subjectData.data)
      setTeachers(teacherData.data)
      setStudents(studentData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lecture workspace')
    } finally {
      setLoading(false)
    }
  }

  const resetMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const openAddModal = () => {
    resetMessages()
    setSelectedLecture(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Lecture) => {
    resetMessages()
    setSelectedLecture(item)
    setFormValues({
      title: item.title,
      description: item.description,
      class: item.class,
      section: item.section,
      subject: item.subject,
      teacher: item.teacher,
      student: item.student,
      date: item.date,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Lecture) => {
    setSelectedLecture(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedLecture(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof LectureFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedLecture ? `/api/lectures/${selectedLecture.id}` : '/api/lectures'
      const method = selectedLecture ? 'PUT' : 'POST'
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        class: formValues.class.trim(),
        section: formValues.section.trim(),
        subject: formValues.subject.trim(),
        teacher: formValues.teacher.trim(),
        student: formValues.student.trim(),
        date: formValues.date,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save lecture')
      }

      setSuccessMessage(data.message || 'Lecture saved successfully')
      setIsFormOpen(false)
      setSelectedLecture(null)
      setFormValues(emptyForm)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lecture')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Lecture) => {
    resetMessages()
    if (!confirm(`Delete lecture "${item.title}"?`)) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/lectures/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete lecture')
      }

      setSuccessMessage(data.message || 'Lecture deleted successfully')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lecture')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: 'Lecture',
      render: (value: string, row: Lecture) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.subject}</p>
        </div>
      ),
      width: '220px',
    },
    { key: 'class', label: 'Class', width: '130px' },
    {
      key: 'teacher',
      label: 'Teacher',
      width: '170px',
    },
    {
      key: 'student',
      label: 'Audience',
      render: (value: string, row: Lecture) => (
        <span>{value || row.section || 'Whole class'}</span>
      ),
      width: '160px',
    },
    {
      key: 'date',
      label: 'Lecture Date',
      render: (value: string) => formatDate(value),
      width: '140px',
    },
    {
      key: 'id',
      label: 'Type',
      render: (_value: string, row: Lecture) => <LectureAudienceBadge student={row.student} section={row.section} />,
      width: '130px',
    },
  ]

  const classOptions = Array.from(new Set(classes.map(item => item.name))).sort()
  const sectionOptions = Array.from(new Set(sections.map(item => item.name))).sort()
  const subjectOptions = Array.from(new Set(subjects.map(item => item.name))).sort()
  const teacherOptions = Array.from(new Set(teachers.map(item => item.name))).sort()
  const studentOptions = Array.from(new Set(students.map(item => item.name))).sort()

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.STUDENT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Lectures"
          description="Manage recorded lectures, coordinate class or student-targeted sessions, and track lecture scheduling from one academic media workspace."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPageData()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Lecture
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Lectures"
            value={stats.total}
            description="Lecture entries in registry"
            icon={<MonitorPlay className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="This Week"
            value={stats.dueThisWeek}
            description="Lectures scheduled within 7 days"
            icon={<CalendarClock className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Classes"
            value={stats.uniqueClasses}
            description="Distinct classes covered"
            icon={<Shapes className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Student Specific"
            value={stats.studentSpecific}
            description="Lectures targeted to one student"
            icon={<UsersRound className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Lecture Registry</CardTitle>
              <CardDescription>Search, review, edit, and manage lecture sessions by class, teacher, audience, and date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="classWide">Class/Section</TabsTrigger>
                  <TabsTrigger value="studentSpecific">Student</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by title, class, section, subject, teacher, student or date"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clapperboard className="h-4 w-4" />
                      {filteredLectures.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredLectures}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Upcoming Lectures</CardTitle>
                <CardDescription>Next lecture sessions scheduled across the academy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingLectures.length === 0 ? (
                  <EmptyMiniState message="No upcoming lectures right now." />
                ) : (
                  upcomingLectures.map(item => (
                    <MiniLectureRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.class} · ${item.teacher}`}
                      trailing={formatDate(item.date)}
                      badge={<LectureAudienceBadge student={item.student} section={item.section} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Teacher Load</CardTitle>
                <CardDescription>Teachers currently carrying the most lecture sessions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacherLoad.length === 0 ? (
                  <EmptyMiniState message="No lecture workload data available yet." />
                ) : (
                  teacherLoad.map(([teacher, count]) => (
                    <QueueRow
                      key={teacher}
                      label={teacher}
                      value={count}
                      helper="Scheduled lectures"
                      icon={<BookOpenText className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Teacher load is based on the live lecture registry.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('upcoming')}>
                  View Upcoming
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Class Coverage</CardTitle>
                <CardDescription>Which classes currently have the highest lecture volume.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classCoverage.length === 0 ? (
                  <EmptyMiniState message="No class coverage available yet." />
                ) : (
                  classCoverage.map(([className, count]) => (
                    <QueueRow
                      key={className}
                      label={className}
                      value={count}
                      helper="Lecture sessions"
                      icon={<CalendarRange className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <LectureFormModal
          classOptions={classOptions}
          sectionOptions={sectionOptions}
          subjectOptions={subjectOptions}
          teacherOptions={teacherOptions}
          studentOptions={studentOptions}
          isEdit={Boolean(selectedLecture)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <LectureViewModal
          item={isViewOpen ? selectedLecture : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedLecture(null)
          }}
          onEdit={item => {
            setIsViewOpen(false)
            openEditModal(item)
          }}
        />
      </div>
    </PermissionGuard>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string
  value: string | number
  description: string
  icon: ReactNode
  accent: 'sky' | 'emerald' | 'amber' | 'violet'
}) {
  const accentClasses = {
    sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
  }

  return (
    <Card className="border border-border/80">
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={cn('rounded-full p-3 ring-1', accentClasses[accent])}>{icon}</div>
      </CardContent>
    </Card>
  )
}

function StatusBanner({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'error' | 'success'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      )}
    >
      {children}
    </div>
  )
}

function LectureAudienceBadge({
  student,
  section,
}: {
  student: string
  section: string
}) {
  if (student.trim()) return <Badge variant="default">Student</Badge>
  if (section.trim()) return <Badge variant="secondary">Section</Badge>
  return <Badge variant="outline">Class</Badge>
}

function MiniLectureRow({
  title,
  subtitle,
  trailing,
  badge,
}: {
  title: string
  subtitle: string
  trailing: string
  badge: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{trailing}</p>
        <div className="mt-1">{badge}</div>
      </div>
    </div>
  )
}

function QueueRow({
  label,
  value,
  helper,
  icon,
}: {
  label: string
  value: number
  helper: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  )
}

function EmptyMiniState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}

function LectureFormModal({
  classOptions,
  sectionOptions,
  subjectOptions,
  teacherOptions,
  studentOptions,
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
}: {
  classOptions: string[]
  sectionOptions: string[]
  subjectOptions: string[]
  teacherOptions: string[]
  studentOptions: string[]
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: LectureFormValues
  onClose: () => void
  onChange: (field: keyof LectureFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Lecture' : 'Add Lecture'}
      description="Create a lecture or update its audience, teacher, class, subject, date, and notes."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" value={values.title} onChange={value => onChange('title', value)} required />
          <SelectField label="Class" value={values.class} onChange={value => onChange('class', value)} options={classOptions} required />
          <SelectField label="Section" value={values.section} onChange={value => onChange('section', value)} options={sectionOptions} />
          <SelectField label="Subject" value={values.subject} onChange={value => onChange('subject', value)} options={subjectOptions} required />
          <SelectField label="Teacher" value={values.teacher} onChange={value => onChange('teacher', value)} options={teacherOptions} required />
          <SelectField label="Student" value={values.student} onChange={value => onChange('student', value)} options={studentOptions} />
          <Field label="Lecture Date" type="date" value={values.date} onChange={value => onChange('date', value)} required />
          <TextAreaField label="Description" value={values.description} onChange={value => onChange('description', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Lecture' : 'Create Lecture'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function LectureViewModal({
  item,
  onClose,
  onEdit,
}: {
  item: Lecture | null
  onClose: () => void
  onEdit: (item: Lecture) => void
}) {
  if (!item) return null

  const rows = [
    { label: 'Title', value: item.title },
    { label: 'Class', value: item.class },
    { label: 'Section', value: item.section || '-' },
    { label: 'Subject', value: item.subject },
    { label: 'Teacher', value: item.teacher },
    { label: 'Student', value: item.student || '-' },
    { label: 'Date', value: formatDate(item.date) },
    { label: 'Description', value: item.description || '-' },
  ]

  return (
    <ModalShell title="Lecture Details" description="Review the selected lecture before making changes." onClose={onClose}>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="text-sm font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={() => onEdit(item)}>
          Edit Lecture
        </Button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            x
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        required={required}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2 md:col-span-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function isSameDay(value: string, compareDate: Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const a = new Date(date)
  const b = new Date(compareDate)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return a.getTime() === b.getTime()
}

function isUpcomingDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() >= today.getTime()
}

function isWithinDays(value: string, days: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const diff = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}
