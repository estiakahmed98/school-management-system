'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BookMarked,
  CalendarClock,
  CalendarRange,
  ClipboardCheck,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Shapes,
  Sparkles,
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
import type { Homework } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type HomeworkFormValues = {
  title: string
  description: string
  class: string
  subject: string
  dueDate: string
}

const emptyForm: HomeworkFormValues = {
  title: '',
  description: '',
  class: '',
  subject: '',
  dueDate: '',
}

export default function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<HomeworkFormValues>(emptyForm)

  useEffect(() => {
    void fetchHomework()
  }, [])

  const filteredHomework = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return homework.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'upcoming' && isUpcomingDate(item.dueDate)) ||
        (activeTab === 'overdue' && isOverdueDate(item.dueDate)) ||
        (activeTab === 'thisWeek' && isWithinDays(item.dueDate, 7))

      if (!matchesTab) return false
      if (!term) return true

      return [item.title, item.description, item.class, item.subject, item.dueDate]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, homework, searchTerm])

  const stats = useMemo(() => {
    const overdueCount = homework.filter(item => isOverdueDate(item.dueDate)).length
    const dueThisWeek = homework.filter(item => isWithinDays(item.dueDate, 7)).length
    const uniqueClasses = new Set(homework.map(item => item.class).filter(Boolean)).size
    const uniqueSubjects = new Set(homework.map(item => item.subject).filter(Boolean)).size

    return {
      total: homework.length,
      overdueCount,
      dueThisWeek,
      uniqueClasses,
      uniqueSubjects,
    }
  }, [homework])

  const upcomingHomework = useMemo(
    () =>
      [...homework]
        .filter(item => isUpcomingDate(item.dueDate))
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
        .slice(0, 5),
    [homework]
  )

  const overdueHomework = useMemo(
    () =>
      [...homework]
        .filter(item => isOverdueDate(item.dueDate))
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
        .slice(0, 5),
    [homework]
  )

  const classSummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of homework) {
      summary.set(item.class, (summary.get(item.class) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [homework])

  const fetchHomework = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/homework', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load homework')
      }

      setHomework(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load homework')
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
    setSelectedHomework(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Homework) => {
    resetMessages()
    setSelectedHomework(item)
    setFormValues({
      title: item.title,
      description: item.description,
      class: item.class,
      subject: item.subject,
      dueDate: item.dueDate,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Homework) => {
    setSelectedHomework(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedHomework(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof HomeworkFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedHomework ? `/api/homework/${selectedHomework.id}` : '/api/homework'
      const method = selectedHomework ? 'PUT' : 'POST'
      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        class: formValues.class.trim(),
        subject: formValues.subject.trim(),
        dueDate: formValues.dueDate,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save homework')
      }

      setSuccessMessage(data.message || 'Homework saved successfully')
      setIsFormOpen(false)
      setSelectedHomework(null)
      setFormValues(emptyForm)
      await fetchHomework()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save homework')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Homework) => {
    resetMessages()

    if (!confirm(`Delete homework "${item.title}"?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/homework/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete homework')
      }

      setSuccessMessage(data.message || 'Homework deleted successfully')
      await fetchHomework()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete homework')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: 'Homework',
      render: (value: string, row: Homework) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.subject}</p>
        </div>
      ),
      width: '230px',
    },
    {
      key: 'class',
      label: 'Class',
      width: '150px',
    },
    {
      key: 'subject',
      label: 'Subject',
      width: '150px',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value: string) => formatDate(value),
      width: '140px',
    },
    {
      key: 'id',
      label: 'Status',
      render: (_value: string, row: Homework) => (
        <HomeworkStatusBadge dueDate={row.dueDate} />
      ),
      width: '130px',
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => <span className="block max-w-[280px] truncate">{value || '-'}</span>,
      width: '280px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.HOMEWORK_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Homework Management"
          description="Manage student homework, review class-wise assignments, and monitor due dates from one academic workspace."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchHomework()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Homework
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Homework"
            value={stats.total}
            description="Assignments recorded in system"
            icon={<NotebookPen className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Due This Week"
            value={stats.dueThisWeek}
            description="Assignments closing within 7 days"
            icon={<CalendarClock className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueCount}
            description="Assignments already past deadline"
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="rose"
          />
          <StatCard
            title="Coverage"
            value={`${stats.uniqueClasses}/${stats.uniqueSubjects}`}
            description="Classes vs subjects involved"
            icon={<Shapes className="h-4 w-4" />}
            accent="amber"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Homework Registry</CardTitle>
              <CardDescription>Search, review, edit, and maintain student assignments by class, subject, and deadline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="thisWeek">This Week</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by title, class, subject, description or due date"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookMarked className="h-4 w-4" />
                      {filteredHomework.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredHomework}
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
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Assignments approaching their due dates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingHomework.length === 0 ? (
                  <EmptyMiniState message="No upcoming homework right now." />
                ) : (
                  upcomingHomework.map(item => (
                    <MiniHomeworkRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.class} · ${item.subject}`}
                      trailing={formatDate(item.dueDate)}
                      badge={<HomeworkStatusBadge dueDate={item.dueDate} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Overdue Watchlist</CardTitle>
                <CardDescription>Assignments that have already crossed the deadline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueHomework.length === 0 ? (
                  <EmptyMiniState message="No overdue homework items." />
                ) : (
                  overdueHomework.map(item => (
                    <MiniHomeworkRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.class} · ${item.subject}`}
                      trailing={formatDate(item.dueDate)}
                      badge={<HomeworkStatusBadge dueDate={item.dueDate} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Overdue assignments remain visible here for teacher follow-up.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('overdue')}>
                  Review Overdue
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Class Snapshot</CardTitle>
                <CardDescription>Which classes currently hold the most homework volume.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classSummary.length === 0 ? (
                  <EmptyMiniState message="No class summary available yet." />
                ) : (
                  classSummary.map(([className, count]) => (
                    <QueueRow
                      key={className}
                      label={className}
                      value={count}
                      helper="Assignments assigned"
                      icon={<ClipboardCheck className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <HomeworkFormModal
          isEdit={Boolean(selectedHomework)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <HomeworkViewModal
          item={isViewOpen ? selectedHomework : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedHomework(null)
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
  accent: 'sky' | 'emerald' | 'rose' | 'amber'
}) {
  const accentClasses = {
    sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    rose: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
    amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
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

function HomeworkStatusBadge({ dueDate }: { dueDate: string }) {
  if (isOverdueDate(dueDate)) {
    return <Badge variant="destructive">Overdue</Badge>
  }

  if (isWithinDays(dueDate, 7)) {
    return <Badge variant="secondary">This Week</Badge>
  }

  return <Badge variant="outline">Upcoming</Badge>
}

function MiniHomeworkRow({
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

function HomeworkFormModal({
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
}: {
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: HomeworkFormValues
  onClose: () => void
  onChange: (field: keyof HomeworkFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Homework' : 'Add Homework'}
      description="Create a class assignment or update its title, class, subject, description, and due date."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" value={values.title} onChange={value => onChange('title', value)} required />
          <Field label="Class" value={values.class} onChange={value => onChange('class', value)} required />
          <Field label="Subject" value={values.subject} onChange={value => onChange('subject', value)} required />
          <Field label="Due Date" type="date" value={values.dueDate} onChange={value => onChange('dueDate', value)} required />
          <TextAreaField label="Description" value={values.description} onChange={value => onChange('description', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Homework' : 'Create Homework'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function HomeworkViewModal({
  item,
  onClose,
  onEdit,
}: {
  item: Homework | null
  onClose: () => void
  onEdit: (item: Homework) => void
}) {
  if (!item) return null

  const rows = [
    { label: 'Title', value: item.title },
    { label: 'Class', value: item.class },
    { label: 'Subject', value: item.subject },
    { label: 'Due Date', value: formatDate(item.dueDate) },
    { label: 'Description', value: item.description || '-' },
  ]

  return (
    <ModalShell title="Homework Details" description="Review the selected assignment before making changes." onClose={onClose}>
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
          Edit Homework
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

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function isOverdueDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
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
