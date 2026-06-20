'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  FileSpreadsheet,
  GraduationCap,
  Medal,
  Plus,
  RefreshCw,
  Send,
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
import type { Exam, Result, Student } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type ResultFormValues = {
  exam: string
  student: string
  totalMarks: string
  grade: string
  gpa: string
  position: string
  isPublished: boolean
}

type ResultWithMeta = Result & {
  className?: string
}

const emptyForm: ResultFormValues = {
  exam: '',
  student: '',
  totalMarks: '',
  grade: '',
  gpa: '',
  position: '',
  isPublished: false,
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultWithMeta[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<ResultWithMeta | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<ResultFormValues>(emptyForm)

  useEffect(() => {
    void fetchPageData()
  }, [])

  const studentClassMap = useMemo(
    () => new Map(students.map(student => [student.name, student.class])),
    [students]
  )

  const hydratedResults = useMemo(
    () =>
      results.map(result => ({
        ...result,
        className: studentClassMap.get(result.student) ?? 'Unassigned',
      })),
    [results, studentClassMap]
  )

  const filteredResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return hydratedResults.filter(result => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'published' && result.isPublished) ||
        (activeTab === 'unpublished' && !result.isPublished) ||
        (activeTab === 'merit' && (result.position ?? 999) <= 10)

      if (!matchesTab) return false

      if (!term) return true

      return [result.exam, result.student, result.grade, result.className ?? '', String(result.totalMarks)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, hydratedResults, searchTerm])

  const stats = useMemo(() => {
    const total = hydratedResults.length
    const published = hydratedResults.filter(result => result.isPublished).length
    const averageGpa =
      total > 0
        ? hydratedResults.reduce((sum, result) => sum + (result.gpa ?? 0), 0) / total
        : 0
    const distinction = hydratedResults.filter(result =>
      ['A+', 'A', 'A-'].includes(result.grade.toUpperCase())
    ).length

    return {
      total,
      published,
      unpublished: total - published,
      averageGpa,
      distinction,
    }
  }, [hydratedResults])

  const topPerformers = useMemo(
    () =>
      [...hydratedResults]
        .sort((left, right) => {
          const leftScore = left.gpa ?? left.totalMarks
          const rightScore = right.gpa ?? right.totalMarks
          return rightScore - leftScore
        })
        .slice(0, 5),
    [hydratedResults]
  )

  const recentPublications = useMemo(
    () => hydratedResults.filter(result => result.isPublished).slice(0, 5),
    [hydratedResults]
  )

  const fetchPageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [resultsRes, studentsRes, examsRes] = await Promise.all([
        fetch('/api/results', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/exams', { cache: 'no-store' }),
      ])

      const [resultsData, studentsData, examsData] = await Promise.all([
        resultsRes.json(),
        studentsRes.json(),
        examsRes.json(),
      ])

      if (!resultsRes.ok || !resultsData.success) {
        throw new Error(resultsData.message || 'Failed to load results')
      }
      if (!studentsRes.ok || !studentsData.success) {
        throw new Error(studentsData.message || 'Failed to load students')
      }
      if (!examsRes.ok || !examsData.success) {
        throw new Error(examsData.message || 'Failed to load exams')
      }

      setResults(resultsData.data)
      setStudents(studentsData.data)
      setExams(examsData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result management data')
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
    setSelectedResult(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (result: ResultWithMeta) => {
    resetMessages()
    setSelectedResult(result)
    setFormValues({
      exam: result.exam,
      student: result.student,
      totalMarks: String(result.totalMarks),
      grade: result.grade,
      gpa: result.gpa == null ? '' : String(result.gpa),
      position: result.position == null ? '' : String(result.position),
      isPublished: result.isPublished,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (result: ResultWithMeta) => {
    setSelectedResult(result)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedResult(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof ResultFormValues, value: string | boolean) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const isEdit = Boolean(selectedResult)
      const endpoint = isEdit ? `/api/results/${selectedResult?.id}` : '/api/results'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        ...(isEdit
          ? {}
          : {
              exam: formValues.exam,
              student: formValues.student,
            }),
        totalMarks: Number(formValues.totalMarks),
        grade: formValues.grade.trim(),
        gpa: formValues.gpa.trim() ? Number(formValues.gpa) : 0,
        position: formValues.position.trim() ? Number(formValues.position) : 0,
        isPublished: formValues.isPublished,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save result')
      }

      setSuccessMessage(data.message || 'Result saved successfully')
      setIsFormOpen(false)
      setSelectedResult(null)
      setFormValues(emptyForm)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save result')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (result: ResultWithMeta) => {
    resetMessages()

    if (!confirm(`Delete ${result.student}'s ${result.exam} result?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/results/${result.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete result')
      }

      setSuccessMessage(data.message || 'Result deleted successfully')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete result')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublishToggle = async (result: ResultWithMeta, nextState: boolean) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/results/${result.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update publish status')
      }

      setSuccessMessage(nextState ? 'Result published successfully' : 'Result moved back to draft')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publish status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'student', label: 'Student' },
    { key: 'className', label: 'Class' },
    { key: 'exam', label: 'Exam' },
    { key: 'totalMarks', label: 'Marks' },
    {
      key: 'grade',
      label: 'Grade',
      render: (value: string) => <Badge variant="outline">{value || 'Pending'}</Badge>,
    },
    {
      key: 'gpa',
      label: 'GPA',
      render: (value: number | null) => (value == null ? '-' : value.toFixed(2)),
    },
    {
      key: 'position',
      label: 'Position',
      render: (value: number | null) => (value ? `#${value}` : '-'),
    },
    {
      key: 'isPublished',
      label: 'Status',
      render: (_value: boolean, row: ResultWithMeta) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.isPublished ? 'default' : 'secondary'}>
            {row.isPublished ? 'Published' : 'Draft'}
          </Badge>
          <Button
            variant="ghost"
            size="xs"
            disabled={submitting}
            onClick={() => handlePublishToggle(row, !row.isPublished)}
          >
            {row.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      ),
      width: '220px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.RESULT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Result Management"
          description="Manage exam results, merit positions, and publication workflow from one control room."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPageData()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Result
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Results"
            value={stats.total}
            description="All recorded result sheets"
            icon={<FileSpreadsheet className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Published"
            value={stats.published}
            description="Visible to students and parents"
            icon={<Send className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Average GPA"
            value={stats.averageGpa.toFixed(2)}
            description="Across all generated results"
            icon={<BarChart3 className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="A Range"
            value={stats.distinction}
            description="A+, A and A- performances"
            icon={<Medal className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Result Registry</CardTitle>
              <CardDescription>Search, review, edit and publish individual student results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All Results</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="unpublished">Draft</TabsTrigger>
                  <TabsTrigger value="merit">Top 10</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 rounded-lg border border-border bg-background px-4 py-2">
                      <input
                        type="text"
                        placeholder="Search by student, exam, class, marks or grade"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {filteredResults.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredResults}
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
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Quick merit glance based on GPA and marks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPerformers.length === 0 ? (
                  <EmptyMiniState message="No results available yet." />
                ) : (
                  topPerformers.map((result, index) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{result.student}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.exam} - {result.className}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          #{result.position || index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          GPA {result.gpa?.toFixed(2) ?? '0.00'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Publication Queue</CardTitle>
                <CardDescription>Keep draft results moving toward release.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueueRow
                  label="Draft results"
                  value={stats.unpublished}
                  helper="Need publish approval"
                />
                <QueueRow
                  label="Published results"
                  value={stats.published}
                  helper="Already visible on portals"
                />
                <QueueRow
                  label="Recent releases"
                  value={recentPublications.length}
                  helper="Latest published entries"
                />
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Use row actions to publish or rollback instantly.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('unpublished')}>
                  Review Drafts
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        <ResultFormModal
          exams={exams}
          students={students}
          isEdit={Boolean(selectedResult)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onChange={handleFormChange}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
        />

        <ResultViewModal
          result={isViewOpen ? selectedResult : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedResult(null)
          }}
          onEdit={result => {
            setIsViewOpen(false)
            openEditModal(result)
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

function QueueRow({
  label,
  value,
  helper,
}: {
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  )
}

function EmptyMiniState({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{message}</p>
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

function ResultFormModal({
  exams,
  students,
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onChange,
  onClose,
  onSubmit,
}: {
  exams: Exam[]
  students: Student[]
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: ResultFormValues
  onChange: (field: keyof ResultFormValues, value: string | boolean) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Result' : 'Add Result'}
      description="Create a new result entry or revise marks, GPA, position and publish status."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Exam"
            value={values.exam}
            onChange={value => onChange('exam', value)}
            disabled={isEdit}
            required
            options={exams.map(exam => ({
              key: exam.id,
              label: exam.name,
              value: exam.name,
            }))}
            placeholder="Select an exam"
          />
          <SelectField
            label="Student"
            value={values.student}
            onChange={value => onChange('student', value)}
            disabled={isEdit}
            required
            options={students.map(student => ({
              key: student.id,
              label: `${student.name} (${student.class})`,
              value: student.name,
            }))}
            placeholder="Select a student"
          />
          <Field
            label="Total Marks"
            type="number"
            value={values.totalMarks}
            onChange={value => onChange('totalMarks', value)}
            required
          />
          <Field label="Grade" value={values.grade} onChange={value => onChange('grade', value)} required />
          <Field label="GPA" type="number" value={values.gpa} onChange={value => onChange('gpa', value)} step="0.01" />
          <Field
            label="Position"
            type="number"
            value={values.position}
            onChange={value => onChange('position', value)}
          />
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <input
            type="checkbox"
            checked={values.isPublished}
            onChange={event => onChange('isPublished', event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Publish result</p>
            <p className="text-xs text-muted-foreground">Enable when this result is ready for portal visibility.</p>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Result' : 'Create Result'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function ResultViewModal({
  result,
  onClose,
  onEdit,
}: {
  result: ResultWithMeta | null
  onClose: () => void
  onEdit: (result: ResultWithMeta) => void
}) {
  if (!result) return null

  const rows = [
    { label: 'Student', value: result.student },
    { label: 'Class', value: result.className || '-' },
    { label: 'Exam', value: result.exam },
    { label: 'Marks', value: String(result.totalMarks) },
    { label: 'Grade', value: result.grade || '-' },
    { label: 'GPA', value: result.gpa == null ? '-' : result.gpa.toFixed(2) },
    { label: 'Position', value: result.position ? `#${result.position}` : '-' },
    { label: 'Status', value: result.isPublished ? 'Published' : 'Draft' },
  ]

  return (
    <ModalShell title="Result Details" description="Review the selected result entry." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(result)}>
          Edit Result
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
  step,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  step?: string
  required?: boolean
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        step={step}
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
  placeholder,
  disabled = false,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ key?: string; label: string; value: string }>
  placeholder: string
  disabled?: boolean
  required?: boolean
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.key ?? `${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
