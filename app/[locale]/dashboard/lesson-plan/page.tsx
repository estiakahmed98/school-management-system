'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  CalendarClock,
  CalendarRange,
  ClipboardPenLine,
  Layers3,
  NotebookTabs,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
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
import type { Class, LessonPlan, Subject, Teacher } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type LessonPlanFormValues = {
  title: string
  description: string
  class: string
  subject: string
  teacher: string
  date: string
}

const emptyForm: LessonPlanFormValues = {
  title: '',
  description: '',
  class: '',
  subject: '',
  teacher: '',
  date: '',
}

export default function LessonPlanPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<LessonPlanFormValues>(emptyForm)

  useEffect(() => {
    void fetchPageData()
  }, [])

  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return lessonPlans.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'upcoming' && isUpcomingDate(item.date)) ||
        (activeTab === 'today' && isSameDay(item.date, new Date())) ||
        (activeTab === 'thisWeek' && isWithinDays(item.date, 7))

      if (!matchesTab) return false
      if (!term) return true

      return [item.title, item.class, item.subject, item.teacher, item.description, item.date]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, lessonPlans, searchTerm])

  const stats = useMemo(() => {
    const uniqueClasses = new Set(lessonPlans.map(item => item.class).filter(Boolean)).size
    const uniqueSubjects = new Set(lessonPlans.map(item => item.subject).filter(Boolean)).size
    const uniqueTeachers = new Set(lessonPlans.map(item => item.teacher).filter(Boolean)).size
    const dueThisWeek = lessonPlans.filter(item => isWithinDays(item.date, 7)).length

    return {
      total: lessonPlans.length,
      uniqueClasses,
      uniqueSubjects,
      uniqueTeachers,
      dueThisWeek,
    }
  }, [lessonPlans])

  const upcomingPlans = useMemo(
    () =>
      [...lessonPlans]
        .filter(item => isUpcomingDate(item.date))
        .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
        .slice(0, 5),
    [lessonPlans]
  )

  const teacherWorkload = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of lessonPlans) {
      summary.set(item.teacher, (summary.get(item.teacher) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [lessonPlans])

  const classDistribution = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of lessonPlans) {
      summary.set(item.class, (summary.get(item.class) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [lessonPlans])

  const fetchPageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [planRes, classRes, subjectRes, teacherRes] = await Promise.all([
        fetch('/api/lesson-plans', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
      ])

      const [planData, classData, subjectData, teacherData] = await Promise.all([
        planRes.json(),
        classRes.json(),
        subjectRes.json(),
        teacherRes.json(),
      ])

      if (!planRes.ok || !planData.success) throw new Error(planData.message || 'Failed to load lesson plans')
      if (!classRes.ok || !classData.success) throw new Error(classData.message || 'Failed to load classes')
      if (!subjectRes.ok || !subjectData.success) throw new Error(subjectData.message || 'Failed to load subjects')
      if (!teacherRes.ok || !teacherData.success) throw new Error(teacherData.message || 'Failed to load teachers')

      setLessonPlans(planData.data)
      setClasses(classData.data)
      setSubjects(subjectData.data)
      setTeachers(teacherData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson plan workspace')
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
    setSelectedPlan(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: LessonPlan) => {
    resetMessages()
    setSelectedPlan(item)
    setFormValues({
      title: item.title,
      description: item.description,
      class: item.class,
      subject: item.subject,
      teacher: item.teacher,
      date: item.date,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: LessonPlan) => {
    setSelectedPlan(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedPlan(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof LessonPlanFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedPlan ? `/api/lesson-plans/${selectedPlan.id}` : '/api/lesson-plans'
      const method = selectedPlan ? 'PUT' : 'POST'
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        class: formValues.class.trim(),
        subject: formValues.subject.trim(),
        teacher: formValues.teacher.trim(),
        date: formValues.date,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save lesson plan')
      }

      setSuccessMessage(data.message || 'Lesson plan saved successfully')
      setIsFormOpen(false)
      setSelectedPlan(null)
      setFormValues(emptyForm)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lesson plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: LessonPlan) => {
    resetMessages()

    if (!confirm(`Delete lesson plan "${item.title}"?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/lesson-plans/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete lesson plan')
      }

      setSuccessMessage(data.message || 'Lesson plan deleted successfully')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson plan')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: 'Lesson Plan',
      render: (value: string, row: LessonPlan) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.subject}</p>
        </div>
      ),
      width: '220px',
    },
    { key: 'class', label: 'Class', width: '140px' },
    { key: 'teacher', label: 'Teacher', width: '180px' },
    {
      key: 'date',
      label: 'Plan Date',
      render: (value: string) => formatDate(value),
      width: '140px',
    },
    {
      key: 'id',
      label: 'Status',
      render: (_value: string, row: LessonPlan) => <PlanStatusBadge date={row.date} />,
      width: '120px',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => <span className="block max-w-[280px] truncate">{value || '-'}</span>,
      width: '280px',
    },
  ]

  const classOptions = Array.from(new Set(classes.map(item => item.name))).sort()
  const teacherOptions = Array.from(new Set(teachers.map(item => item.name))).sort()
  const subjectOptions = Array.from(new Set(subjects.map(item => item.name))).sort()

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.TEACHER_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Lesson Plan"
          description="Create and manage lesson plans, coordinate teaching schedules, and organize academic preparation across classes and teachers."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPageData()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Plan
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Plans"
            value={stats.total}
            description="Lesson plans in registry"
            icon={<NotebookTabs className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="This Week"
            value={stats.dueThisWeek}
            description="Plans scheduled within 7 days"
            icon={<CalendarClock className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Coverage"
            value={`${stats.uniqueClasses}/${stats.uniqueSubjects}`}
            description="Classes vs subjects involved"
            icon={<Layers3 className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Teachers"
            value={stats.uniqueTeachers}
            description="Teachers with assigned plans"
            icon={<UserRound className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Lesson Plan Registry</CardTitle>
              <CardDescription>Search, review, edit, and manage lesson plans by class, subject, teacher, and teaching date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="thisWeek">This Week</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by title, class, subject, teacher, date or description"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpenCheck className="h-4 w-4" />
                      {filteredPlans.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredPlans}
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
                <CardTitle>Upcoming Plans</CardTitle>
                <CardDescription>Next scheduled lesson plans across classes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPlans.length === 0 ? (
                  <EmptyMiniState message="No upcoming lesson plans right now." />
                ) : (
                  upcomingPlans.map(item => (
                    <MiniPlanRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.class} · ${item.teacher}`}
                      trailing={formatDate(item.date)}
                      badge={<PlanStatusBadge date={item.date} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Teacher Workload</CardTitle>
                <CardDescription>Teachers currently carrying the most lesson plans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacherWorkload.length === 0 ? (
                  <EmptyMiniState message="No teacher workload data available yet." />
                ) : (
                  teacherWorkload.map(([teacher, count]) => (
                    <QueueRow
                      key={teacher}
                      label={teacher}
                      value={count}
                      helper="Assigned lesson plans"
                      icon={<ClipboardPenLine className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Workload is calculated from the live lesson plan registry.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('thisWeek')}>
                  View This Week
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Which classes currently hold the most planned lessons.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classDistribution.length === 0 ? (
                  <EmptyMiniState message="No class distribution available yet." />
                ) : (
                  classDistribution.map(([className, count]) => (
                    <QueueRow
                      key={className}
                      label={className}
                      value={count}
                      helper="Lesson plans assigned"
                      icon={<CalendarRange className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <LessonPlanFormModal
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          teacherOptions={teacherOptions}
          isEdit={Boolean(selectedPlan)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <LessonPlanViewModal
          item={isViewOpen ? selectedPlan : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedPlan(null)
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

function PlanStatusBadge({ date }: { date: string }) {
  if (isSameDay(date, new Date())) {
    return <Badge variant="default">Today</Badge>
  }

  if (isWithinDays(date, 7)) {
    return <Badge variant="secondary">This Week</Badge>
  }

  return <Badge variant="outline">Upcoming</Badge>
}

function MiniPlanRow({
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

function LessonPlanFormModal({
  classOptions,
  subjectOptions,
  teacherOptions,
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
}: {
  classOptions: string[]
  subjectOptions: string[]
  teacherOptions: string[]
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: LessonPlanFormValues
  onClose: () => void
  onChange: (field: keyof LessonPlanFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Lesson Plan' : 'Add Lesson Plan'}
      description="Create a lesson plan or update its class, subject, teacher, date, and teaching notes."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" value={values.title} onChange={value => onChange('title', value)} required />
          <SelectField label="Class" value={values.class} onChange={value => onChange('class', value)} options={classOptions} required />
          <SelectField label="Subject" value={values.subject} onChange={value => onChange('subject', value)} options={subjectOptions} required />
          <SelectField label="Teacher" value={values.teacher} onChange={value => onChange('teacher', value)} options={teacherOptions} required />
          <Field label="Plan Date" type="date" value={values.date} onChange={value => onChange('date', value)} required />
          <TextAreaField label="Description" value={values.description} onChange={value => onChange('description', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function LessonPlanViewModal({
  item,
  onClose,
  onEdit,
}: {
  item: LessonPlan | null
  onClose: () => void
  onEdit: (item: LessonPlan) => void
}) {
  if (!item) return null

  const rows = [
    { label: 'Title', value: item.title },
    { label: 'Class', value: item.class },
    { label: 'Subject', value: item.subject },
    { label: 'Teacher', value: item.teacher },
    { label: 'Date', value: formatDate(item.date) },
    { label: 'Description', value: item.description || '-' },
  ]

  return (
    <ModalShell title="Lesson Plan Details" description="Review the selected lesson plan before making changes." onClose={onClose}>
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
          Edit Plan
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
