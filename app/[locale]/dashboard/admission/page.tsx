'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Clock3,
  FileClock,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { DataTable, type ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Admission, Class } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type AdmissionStatus = Admission['status']

type AdmissionFormValues = {
  studentName: string
  email: string
  phone: string
  classId: string
  status: AdmissionStatus
  note: string
}

const emptyForm: AdmissionFormValues = {
  studentName: '',
  email: '',
  phone: '',
  classId: '',
  status: 'pending',
  note: '',
}

export default function AdmissionPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<AdmissionFormValues>(emptyForm)

  useEffect(() => {
    void fetchPageData()
  }, [])

  const filteredAdmissions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return admissions.filter(admission => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && admission.status === 'pending') ||
        (activeTab === 'approved' && admission.status === 'approved') ||
        (activeTab === 'rejected' && admission.status === 'rejected')

      if (!matchesTab) return false
      if (!term) return true

      return [
        admission.studentName,
        admission.email,
        admission.phone,
        admission.className,
        admission.status,
        admission.note,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, admissions, searchTerm])

  const stats = useMemo(() => {
    const pending = admissions.filter(item => item.status === 'pending').length
    const approved = admissions.filter(item => item.status === 'approved').length
    const rejected = admissions.filter(item => item.status === 'rejected').length

    return {
      total: admissions.length,
      pending,
      approved,
      rejected,
    }
  }, [admissions])

  const pendingQueue = useMemo(
    () =>
      [...admissions]
        .filter(item => item.status === 'pending')
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 5),
    [admissions]
  )

  const approvalTrail = useMemo(
    () =>
      [...admissions]
        .filter(item => item.status !== 'pending')
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 5),
    [admissions]
  )

  const fetchPageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [admissionsRes, classesRes] = await Promise.all([
        fetch('/api/admissions', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
      ])

      const [admissionsData, classesData] = await Promise.all([admissionsRes.json(), classesRes.json()])

      if (!admissionsRes.ok || !admissionsData.success) {
        throw new Error(admissionsData.message || 'Failed to load admission applications')
      }

      if (!classesRes.ok || !classesData.success) {
        throw new Error(classesData.message || 'Failed to load class list')
      }

      setAdmissions(admissionsData.data)
      setClasses(classesData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admission management data')
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
    setSelectedAdmission(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (admission: Admission) => {
    resetMessages()
    setSelectedAdmission(admission)
    setFormValues({
      studentName: admission.studentName,
      email: admission.email,
      phone: admission.phone,
      classId: admission.classId,
      status: admission.status,
      note: admission.note,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (admission: Admission) => {
    setSelectedAdmission(admission)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedAdmission(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof AdmissionFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const isEdit = Boolean(selectedAdmission)
      const endpoint = isEdit ? `/api/admissions/${selectedAdmission?.id}` : '/api/admissions'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        studentName: formValues.studentName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        classId: formValues.classId,
        status: formValues.status,
        note: formValues.note.trim(),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save admission application')
      }

      setSuccessMessage(data.message || 'Admission saved successfully')
      setIsFormOpen(false)
      setSelectedAdmission(null)
      setFormValues(emptyForm)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save admission application')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (admission: Admission) => {
    resetMessages()

    if (!confirm(`Delete admission for ${admission.studentName}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/admissions/${admission.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete admission application')
      }

      setSuccessMessage(data.message || 'Admission deleted successfully')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admission application')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (admission: Admission, status: AdmissionStatus) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/admissions/${admission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update admission status')
      }

      setSuccessMessage(`Admission marked as ${status}`)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admission status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'studentName',
      label: 'Applicant',
      render: (value: string, row: Admission) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'className',
      label: 'Class',
      width: '140px',
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '140px',
    },
    {
      key: 'createdAt',
      label: 'Applied',
      render: (value: string) => formatDateTime(value),
      width: '170px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: AdmissionStatus) => <StatusBadge status={value} />,
      width: '120px',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_value: string, row: Admission) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="xs" disabled={submitting} onClick={() => openViewModal(row)}>
            View
          </Button>
          <Button variant="ghost" size="xs" disabled={submitting} onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleDelete(row)}>
            Delete
          </Button>
          {row.status !== 'approved' ? (
            <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleStatusUpdate(row, 'approved')}>
              Approve
            </Button>
          ) : null}
          {row.status !== 'rejected' ? (
            <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleStatusUpdate(row, 'rejected')}>
              Reject
            </Button>
          ) : null}
          {row.status !== 'pending' ? (
            <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleStatusUpdate(row, 'pending')}>
              Reset
            </Button>
          ) : null}
        </div>
      ),
      width: '360px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard
      permission={PERMISSIONS.ADMISSION_VIEW}
      fallback={
        <AccessDeniedState
          title="Private Admission Management"
          description="This route is restricted to roles with admission permissions. Public admission posting will be added separately on the landing side later."
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Admission Management"
          description="Manage applications, review notes, approve or reject requests, and keep the public admission portal separate for later."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPageData()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                New Application
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Applications"
            value={stats.total}
            description="All admission requests"
            icon={<GraduationCap className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            description="Waiting for action"
            icon={<FileClock className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            description="Cleared for enrollment"
            icon={<BadgeCheck className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            description="Closed applications"
            icon={<XCircle className="h-4 w-4" />}
            accent="rose"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Application Registry</CardTitle>
              <CardDescription>Search and manage admission requests before they are converted into student records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by student, email, phone, class, status or note"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {filteredAdmissions.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredAdmissions}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    actions={false}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Pending Queue</CardTitle>
                <CardDescription>New requests waiting for an admission decision.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingQueue.length === 0 ? (
                  <EmptyMiniState message="No pending applications right now." />
                ) : (
                  pendingQueue.map(item => (
                    <MiniRow
                      key={item.id}
                      title={item.studentName}
                      subtitle={`${item.className} | ${formatDateTime(item.createdAt)}`}
                      trailing={item.email}
                      badge={<StatusBadge status={item.status} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Use Approve or Reject directly from the registry.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('pending')}>
                  Review Pending
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Processing Trail</CardTitle>
                <CardDescription>Recently handled applications and their latest state.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {approvalTrail.length === 0 ? (
                  <EmptyMiniState message="No processed applications yet." />
                ) : (
                  approvalTrail.map(item => (
                    <MiniRow
                      key={item.id}
                      title={item.studentName}
                      subtitle={`${item.className} | ${formatDateTime(item.updatedAt)}`}
                      trailing={item.status.toUpperCase()}
                      badge={<StatusBadge status={item.status} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Admission Pulse</CardTitle>
                <CardDescription>Quick operational signals for the admissions desk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueueRow
                  label="Available classes"
                  value={classes.length}
                  helper="Target classes for applicants"
                  icon={<GraduationCap className="h-4 w-4" />}
                />
                <QueueRow
                  label="Pending review"
                  value={stats.pending}
                  helper="Needs a decision"
                  icon={<Clock3 className="h-4 w-4" />}
                />
                <QueueRow
                  label="Active approvals"
                  value={stats.approved}
                  helper="Approved intakes"
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <AdmissionFormModal
          classes={classes}
          isEdit={Boolean(selectedAdmission)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <AdmissionViewModal
          admission={isViewOpen ? selectedAdmission : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedAdmission(null)
          }}
          onEdit={admission => {
            setIsViewOpen(false)
            openEditModal(admission)
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
  accent: 'emerald' | 'amber' | 'rose' | 'sky'
}) {
  const accentClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
    sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
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

function StatusBadge({ status }: { status: AdmissionStatus }) {
  if (status === 'approved') {
    return <Badge variant="default">Approved</Badge>
  }

  if (status === 'rejected') {
    return <Badge variant="destructive">Rejected</Badge>
  }

  return <Badge variant="outline">Pending</Badge>
}

function MiniRow({
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
        <p className="truncate text-sm text-foreground">{trailing}</p>
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

function AccessDeniedState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl border border-border/80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Admission records are private. Once the public landing form is added, guest submissions can flow here without exposing this management screen.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdmissionFormModal({
  classes,
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
}: {
  classes: Class[]
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: AdmissionFormValues
  onClose: () => void
  onChange: (field: keyof AdmissionFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Application' : 'New Admission Application'}
      description="Capture applicant details, assign a class, and keep the review status ready for approval workflow."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Student Name" value={values.studentName} onChange={value => onChange('studentName', value)} required />
          <Field label="Email" value={values.email} onChange={value => onChange('email', value)} type="email" required />
          <Field label="Phone" value={values.phone} onChange={value => onChange('phone', value)} />
          <SelectField
            label="Class"
            value={values.classId}
            onChange={value => onChange('classId', value)}
            options={classes.map(item => ({
              value: item.id,
              label: `${item.name}${item.section ? ` - ${item.section}` : ''}`,
            }))}
            placeholder="Select class"
            required
          />
          <SelectField
            label="Status"
            value={values.status}
            onChange={value => onChange('status', value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            placeholder="Select status"
            required
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Note</span>
          <textarea
            value={values.note}
            onChange={event => onChange('note', event.target.value)}
            rows={5}
            placeholder="Internal note, follow-up reminder, or admission remarks..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Application' : 'Create Application'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function AdmissionViewModal({
  admission,
  onClose,
  onEdit,
}: {
  admission: Admission | null
  onClose: () => void
  onEdit: (admission: Admission) => void
}) {
  if (!admission) return null

  const rows = [
    { label: 'Student Name', value: admission.studentName },
    { label: 'Email', value: admission.email },
    { label: 'Phone', value: admission.phone || '-' },
    { label: 'Class', value: admission.className || '-' },
    { label: 'Status', value: admission.status.toUpperCase() },
    { label: 'Created At', value: formatDateTime(admission.createdAt) },
    { label: 'Updated At', value: formatDateTime(admission.updatedAt) },
    { label: 'Note', value: admission.note || '-' },
  ]

  return (
    <ModalShell title="Admission Details" description="Review the application before changing its state." onClose={onClose}>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">{row.label}</span>
            <span className="max-w-[65%] text-right text-sm font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={() => onEdit(admission)}>
          Edit Application
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
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  placeholder: string
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
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
