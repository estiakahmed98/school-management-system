'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CrudPageLayout } from '@/components/crud/crud-page-layout'
import { ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { PermissionGuard } from '@/components/common/permission-guard'
import { PERMISSIONS } from '@/lib/auth/constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Class, Teacher } from '@/lib/mock-data'

type ClassFormValues = {
  name: string
  section: string
  capacity: string
  room: string
  classTeacher: string
}

const emptyForm: ClassFormValues = {
  name: '',
  section: '',
  capacity: '',
  room: '',
  classTeacher: '',
}

export default function ClassesPage() {
  const t = useTranslations()
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formValues, setFormValues] = useState<ClassFormValues>(emptyForm)

  useEffect(() => {
    void fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    setError(null)

    try {
      const [classesRes, teachersRes] = await Promise.all([
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
      ])

      const [classesData, teachersData] = await Promise.all([classesRes.json(), teachersRes.json()])

      if (!classesRes.ok || !classesData.success) {
        throw new Error(classesData.message || t('common.error'))
      }

      if (!teachersRes.ok || !teachersData.success) {
        throw new Error(teachersData.message || t('common.error'))
      }

      setClasses(classesData.data)
      setTeachers(teachersData.data)
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
    setSelectedClass(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Class) => {
    resetMessages()
    setSelectedClass(item)
    setFormValues({
      name: item.name,
      section: item.section,
      capacity: item.capacity ? String(item.capacity) : '',
      room: item.room,
      classTeacher: item.classTeacher,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Class) => {
    setSelectedClass(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedClass(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof ClassFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setIsSubmitting(true)

    try {
      const method = selectedClass ? 'PUT' : 'POST'
      const endpoint = selectedClass ? `/api/classes/${selectedClass.id}` : '/api/classes'
      const payload = {
        name: formValues.name.trim(),
        section: formValues.section.trim(),
        capacity: formValues.capacity.trim() ? Number(formValues.capacity) : 40,
        room: formValues.room.trim(),
        classTeacher: formValues.classTeacher.trim(),
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
      setSelectedClass(null)
      setFormValues(emptyForm)
      await fetchClasses()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: Class) => {
    resetMessages()

    if (!confirm(`Delete ${item.name} - ${item.section}?`)) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/classes/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || t('common.error'))
      }

      setSuccessMessage(data.message || t('common.deleteSuccess'))
      await fetchClasses()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    { key: 'name', label: 'Class Name' },
    { key: 'section', label: t('students.section') },
    { key: 'classTeacher', label: 'Class Teacher' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'room', label: 'Room' },
  ]

  const teacherOptions = useMemo(
    () => Array.from(new Set(teachers.map(item => item.name).filter(Boolean))).sort(),
    [teachers]
  )

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.CLASS_VIEW}>
      <div className="space-y-4">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <CrudPageLayout
          title="Class Management"
          columns={columns}
          data={classes}
          onView={openViewModal}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
          addButtonLabel="Add Class"
        />

        <ClassFormModal
          isOpen={isFormOpen}
          isSubmitting={isSubmitting}
          isEdit={Boolean(selectedClass)}
          values={formValues}
          teacherOptions={teacherOptions}
          title={selectedClass ? 'Edit Class' : 'Add Class'}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          t={t}
        />

        <ClassViewModal
          item={isViewOpen ? selectedClass : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedClass(null)
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

function ClassFormModal({
  isOpen,
  isSubmitting,
  isEdit,
  values,
  teacherOptions,
  title,
  onClose,
  onSubmit,
  onChange,
  t,
}: {
  isOpen: boolean
  isSubmitting: boolean
  isEdit: boolean
  values: ClassFormValues
  teacherOptions: string[]
  title: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof ClassFormValues, value: string) => void
  t: ReturnType<typeof useTranslations>
}) {
  if (!isOpen) return null

  return (
    <ModalShell title={title} description="Create or update class and section records from one place." onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Class Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label={t('students.section')} value={values.section} onChange={value => onChange('section', value)} required />
          <SelectField
            label="Class Teacher"
            value={values.classTeacher}
            onChange={value => onChange('classTeacher', value)}
            options={teacherOptions}
          />
          <Field label="Capacity" value={values.capacity} onChange={value => onChange('capacity', value)} type="number" required />
          <Field label="Room" value={values.room} onChange={value => onChange('room', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? t('common.save') : 'Create Class'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function ClassViewModal({
  item,
  onClose,
  onEdit,
}: {
  item: Class | null
  onClose: () => void
  onEdit: (item: Class) => void
}) {
  if (!item) return null

  const rows = [
    { label: 'Class Name', value: item.name },
    { label: 'Section', value: item.section || '-' },
    { label: 'Class Teacher', value: item.classTeacher || '-' },
    { label: 'Capacity', value: String(item.capacity ?? '-') },
    { label: 'Room', value: item.room || '-' },
  ]

  return (
    <ModalShell title="Class Details" description="Review the selected class information." onClose={onClose}>
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
          Cancel
        </Button>
        <Button type="button" onClick={() => onEdit(item)}>
          Edit
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
