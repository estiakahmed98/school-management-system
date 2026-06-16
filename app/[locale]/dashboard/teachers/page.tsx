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
import type { Teacher } from '@/lib/mock-data'

type TeacherFormValues = {
  name: string
  subject: string
  qualification: string
  phone: string
  email: string
  joinDate: string
}

const emptyForm: TeacherFormValues = {
  name: '',
  subject: '',
  qualification: '',
  phone: '',
  email: '',
  joinDate: '',
}

export default function TeachersPage() {
  const t = useTranslations()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/teachers', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setTeachers(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const [formValues, setFormValues] = useState<TeacherFormValues>(emptyForm)

  const resetMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const openAddModal = () => {
    resetMessages()
    setSelectedTeacher(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (teacher: Teacher) => {
    resetMessages()
    setSelectedTeacher(teacher)
    setFormValues({
      name: teacher.name,
      subject: teacher.subject,
      qualification: teacher.qualification,
      phone: teacher.phone,
      email: teacher.email,
      joinDate: teacher.joinDate,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedTeacher(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof TeacherFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const method = selectedTeacher ? 'PUT' : 'POST'
      const endpoint = selectedTeacher ? `/api/teachers/${selectedTeacher.id}` : '/api/teachers'
      const payload = {
        name: formValues.name.trim(),
        subject: formValues.subject.trim(),
        qualification: formValues.qualification.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        joinDate: formValues.joinDate,
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
      setSelectedTeacher(null)
      setFormValues(emptyForm)
      await fetchTeachers()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (teacher: Teacher) => {
    resetMessages()

    if (!confirm(`Delete ${teacher.name}?`)) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/teachers/${teacher.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSuccessMessage(data.message || t('common.deleteSuccess'))
      await fetchTeachers()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: t('teachers.name') },
    { key: 'subject', label: t('teachers.subject') },
    { key: 'qualification', label: t('teachers.qualification') },
    { key: 'phone', label: t('teachers.phone') },
    { key: 'email', label: t('teachers.email') },
    { key: 'joinDate', label: 'Join Date' },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.TEACHER_VIEW}>
      <div className="space-y-4">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <CrudPageLayout
          title={t('teachers.title')}
          columns={columns}
          data={teachers}
          onView={openViewModal}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          addButtonLabel={t('teachers.addTeacher')}
        />

        <TeacherFormModal
          isOpen={isFormOpen}
          isSubmitting={isSubmitting}
          isEdit={Boolean(selectedTeacher)}
          values={formValues}
          title={selectedTeacher ? t('teachers.editTeacher') : t('teachers.addTeacher')}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          t={t}
        />

        <TeacherViewModal
          teacher={isViewOpen ? selectedTeacher : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedTeacher(null)
          }}
          onEdit={teacher => {
            setIsViewOpen(false)
            openEditModal(teacher)
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

function TeacherFormModal({
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
  values: TeacherFormValues
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof TeacherFormValues, value: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!isOpen) return null

  return (
    <ModalShell title={title} description="Create or update teacher records from one place." onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={t('teachers.name')}
            value={values.name}
            onChange={value => onChange('name', value)}
            required
          />
          <Field
            label={t('teachers.subject')}
            value={values.subject}
            onChange={value => onChange('subject', value)}
            required
          />
          <Field
            label={t('teachers.qualification')}
            value={values.qualification}
            onChange={value => onChange('qualification', value)}
            required
          />
          <Field
            label={t('teachers.phone')}
            value={values.phone}
            onChange={value => onChange('phone', value)}
            type="tel"
            required
          />
          <Field
            label={t('teachers.email')}
            value={values.email}
            onChange={value => onChange('email', value)}
            type="email"
            required
          />
          <Field
            label="Join Date"
            value={values.joinDate}
            onChange={value => onChange('joinDate', value)}
            type="date"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? t('common.save') : 'Create Teacher'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function TeacherViewModal({
  teacher,
  onClose,
  onEdit,
  t,
}: {
  teacher: Teacher | null
  onClose: () => void
  onEdit: (teacher: Teacher) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!teacher) return null

  const rows = [
    { label: t('teachers.name'), value: teacher.name },
    { label: t('teachers.subject'), value: teacher.subject || '-' },
    { label: t('teachers.qualification'), value: teacher.qualification || '-' },
    { label: t('teachers.phone'), value: teacher.phone || '-' },
    { label: t('teachers.email'), value: teacher.email || '-' },
    { label: 'Join Date', value: teacher.joinDate || '-' },
    { label: 'Status', value: teacher.status },
  ]

  return (
    <ModalShell title="Teacher Details" description="Review the selected teacher's information." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(teacher)}>
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
