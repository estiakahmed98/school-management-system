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
import type { Subject } from '@/lib/mock-data'

type SubjectFormValues = {
  name: string
  code: string
  class: string
  teacher: string
}

const emptyForm: SubjectFormValues = {
  name: '',
  code: '',
  class: '',
  teacher: '',
}

export default function SubjectsPage() {
  const t = useTranslations()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<SubjectFormValues>(emptyForm)

  useEffect(() => {
    void fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/subjects', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSubjects(data.data)
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
    setSelectedSubject(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (subject: Subject) => {
    resetMessages()
    setSelectedSubject(subject)
    setFormValues({
      name: subject.name,
      code: subject.code,
      class: subject.class,
      teacher: subject.teacher,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedSubject(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof SubjectFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const method = selectedSubject ? 'PUT' : 'POST'
      const endpoint = selectedSubject ? `/api/subjects/${selectedSubject.id}` : '/api/subjects'
      const payload = {
        name: formValues.name.trim(),
        code: formValues.code.trim(),
        class: formValues.class.trim(),
        teacher: formValues.teacher.trim(),
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
      setSelectedSubject(null)
      setFormValues(emptyForm)
      await fetchSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (subject: Subject) => {
    resetMessages()

    if (!confirm(`Delete ${subject.name}?`)) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/subjects/${subject.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSuccessMessage(data.message || t('common.deleteSuccess'))
      await fetchSubjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    { key: 'class', label: t('students.class') },
    { key: 'teacher', label: t('navigation.teachers') },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.SUBJECT_VIEW}>
      <div className="space-y-4">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <CrudPageLayout
          title="Subject Management"
          description="Create, review, and update subject assignments."
          columns={columns}
          data={subjects}
          onView={openViewModal}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          addButtonLabel="Add Subject"
        />

        <SubjectFormModal
          isOpen={isFormOpen}
          isSubmitting={isSubmitting}
          isEdit={Boolean(selectedSubject)}
          values={formValues}
          title={selectedSubject ? 'Edit Subject' : 'Add Subject'}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          t={t}
        />

        <SubjectViewModal
          subject={isViewOpen ? selectedSubject : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedSubject(null)
          }}
          onEdit={subject => {
            setIsViewOpen(false)
            openEditModal(subject)
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

function SubjectFormModal({
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
  values: SubjectFormValues
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof SubjectFormValues, value: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!isOpen) return null

  return (
    <ModalShell title={title} description="Create or update subject records from one place." onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Subject Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label="Code" value={values.code} onChange={value => onChange('code', value)} />
          <Field label={t('students.class')} value={values.class} onChange={value => onChange('class', value)} required />
          <Field
            label={t('navigation.teachers')}
            value={values.teacher}
            onChange={value => onChange('teacher', value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? t('common.save') : 'Create Subject'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function SubjectViewModal({
  subject,
  onClose,
  onEdit,
  t,
}: {
  subject: Subject | null
  onClose: () => void
  onEdit: (subject: Subject) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!subject) return null

  const rows = [
    { label: 'Subject Name', value: subject.name },
    { label: 'Code', value: subject.code || '-' },
    { label: t('students.class'), value: subject.class || '-' },
    { label: t('navigation.teachers'), value: subject.teacher || '-' },
  ]

  return (
    <ModalShell title="Subject Details" description="Review the selected subject information." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(subject)}>
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
