'use client'

import { FormEvent, ReactNode, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Exam } from '@/lib/mock-data'

type ExamFormValues = {
  name: string
  class: string
  subject: string
  date: string
  totalMarks: string
}

const emptyForm: ExamFormValues = {
  name: '',
  class: '',
  subject: '',
  date: '',
  totalMarks: '100',
}

export default function ExamsPage() {
  const t = useTranslations()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<ExamFormValues>(emptyForm)

  useEffect(() => {
    void fetchExams()
  }, [])

  const fetchExams = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/exams', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setExams(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
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
    setSelectedExam(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (exam: Exam) => {
    resetMessages()
    setSelectedExam(exam)
    setFormValues({
      name: exam.name,
      class: exam.class,
      subject: exam.subject,
      date: exam.date,
      totalMarks: String(exam.totalMarks),
    })
    setIsFormOpen(true)
  }

  const openViewModal = (exam: Exam) => {
    setSelectedExam(exam)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedExam(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof ExamFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const method = selectedExam ? 'PUT' : 'POST'
      const endpoint = selectedExam ? `/api/exams/${selectedExam.id}` : '/api/exams'
      const payload = {
        name: formValues.name.trim(),
        class: formValues.class.trim(),
        subject: formValues.subject.trim(),
        date: formValues.date,
        totalMarks: formValues.totalMarks.trim() ? Number(formValues.totalMarks) : 100,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSuccessMessage(data.message || t('common.saveSuccess'))
      setIsFormOpen(false)
      setSelectedExam(null)
      setFormValues(emptyForm)
      await fetchExams()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (exam: Exam) => {
    resetMessages()

    if (!confirm(`Delete ${exam.name}?`)) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSuccessMessage(data.message || t('common.deleteSuccess'))
      await fetchExams()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Exam Name' },
    { key: 'class', label: t('exams.class') },
    { key: 'subject', label: t('exams.subject') },
    { key: 'date', label: t('exams.date') },
    { key: 'totalMarks', label: 'Total Marks' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.EXAM_VIEW}>
      <div className="space-y-4">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <CrudPageLayout
          title={t('exams.title')}
          description="Create, review, and update exam schedules from one place."
          columns={columns}
          data={exams}
          onView={openViewModal}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          addButtonLabel={t('exams.addExam')}
        />

        <ExamFormModal
          isOpen={isFormOpen}
          isSubmitting={isSubmitting}
          isEdit={Boolean(selectedExam)}
          values={formValues}
          title={selectedExam ? t('exams.editExam') : t('exams.addExam')}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          t={t}
        />

        <ExamViewModal
          exam={isViewOpen ? selectedExam : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedExam(null)
          }}
          onEdit={exam => {
            setIsViewOpen(false)
            openEditModal(exam)
          }}
          t={t}
        />
      </div>
    </PermissionGuard>
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

function ExamFormModal({
  isOpen,
  isSubmitting,
  isEdit,
  values,
  title,
  onClose,
  onSubmit,
  onChange,
  t,
}: {
  isOpen: boolean
  isSubmitting: boolean
  isEdit: boolean
  values: ExamFormValues
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof ExamFormValues, value: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!isOpen) return null

  return (
    <ModalShell title={title} description="Create or update exam records from one place." onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Exam Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label={t('exams.class')} value={values.class} onChange={value => onChange('class', value)} required />
          <Field label={t('exams.subject')} value={values.subject} onChange={value => onChange('subject', value)} />
          <Field label={t('exams.date')} value={values.date} onChange={value => onChange('date', value)} type="date" required />
          <Field
            label="Total Marks"
            value={values.totalMarks}
            onChange={value => onChange('totalMarks', value)}
            type="number"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? t('common.save') : 'Create Exam'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function ExamViewModal({
  exam,
  onClose,
  onEdit,
  t,
}: {
  exam: Exam | null
  onClose: () => void
  onEdit: (exam: Exam) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!exam) return null

  const rows = [
    { label: 'Exam Name', value: exam.name },
    { label: t('exams.class'), value: exam.class || '-' },
    { label: t('exams.subject'), value: exam.subject || '-' },
    { label: t('exams.date'), value: exam.date || '-' },
    { label: 'Total Marks', value: String(exam.totalMarks ?? '-') },
  ]

  return (
    <ModalShell title="Exam Details" description="Review the selected exam information." onClose={onClose}>
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
          {t('common.cancel')}
        </Button>
        <Button type="button" onClick={() => onEdit(exam)}>
          {t('common.edit')}
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
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
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
