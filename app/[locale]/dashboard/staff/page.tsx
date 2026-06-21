'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Users2,
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
import type { Staff } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type StaffFormValues = {
  name: string
  position: string
  department: string
  phone: string
  email: string
  joinDate: string
  status: Staff['status']
}

const emptyForm: StaffFormValues = {
  name: '',
  position: '',
  department: '',
  phone: '',
  email: '',
  joinDate: '',
  status: 'active',
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<StaffFormValues>(emptyForm)

  useEffect(() => {
    void fetchStaff()
  }, [])

  const filteredStaff = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return staff.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && item.status === 'active') ||
        (activeTab === 'inactive' && item.status === 'inactive') ||
        (activeTab === 'recent' && isRecentDate(item.joinDate))

      if (!matchesTab) return false
      if (!term) return true

      return [item.name, item.position, item.department, item.phone, item.email, item.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, searchTerm, staff])

  const stats = useMemo(() => {
    const activeCount = staff.filter(item => item.status === 'active').length
    const inactiveCount = staff.filter(item => item.status === 'inactive').length
    const uniqueDepartments = new Set(
      staff.map(item => item.department).filter(Boolean)
    ).size

    return {
      total: staff.length,
      activeCount,
      inactiveCount,
      uniqueDepartments,
      recentJoiners: staff.filter(item => isRecentDate(item.joinDate)).length,
    }
  }, [staff])

  const recentJoiners = useMemo(
    () =>
      [...staff]
        .sort((left, right) => new Date(right.joinDate).getTime() - new Date(left.joinDate).getTime())
        .slice(0, 5),
    [staff]
  )

  const departmentSummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of staff) {
      const department = item.department || 'Unassigned'
      summary.set(department, (summary.get(department) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [staff])

  const fetchStaff = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/staff', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load staff records')
      }

      setStaff(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff records')
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
    setSelectedStaff(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Staff) => {
    resetMessages()
    setSelectedStaff(item)
    setFormValues({
      name: item.name,
      position: item.position,
      department: item.department,
      phone: item.phone,
      email: item.email,
      joinDate: item.joinDate,
      status: item.status,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Staff) => {
    setSelectedStaff(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedStaff(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof StaffFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedStaff ? `/api/staff/${selectedStaff.id}` : '/api/staff'
      const method = selectedStaff ? 'PUT' : 'POST'
      const payload = {
        name: formValues.name.trim(),
        position: formValues.position.trim(),
        department: formValues.department.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        joinDate: formValues.joinDate,
        status: formValues.status,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save staff record')
      }

      setSuccessMessage(data.message || 'Staff saved successfully')
      setIsFormOpen(false)
      setSelectedStaff(null)
      setFormValues(emptyForm)
      await fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Staff) => {
    resetMessages()

    if (!confirm(`Delete ${item.name}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/staff/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete staff record')
      }

      setSuccessMessage(data.message || 'Staff deleted successfully')
      await fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (item: Staff, status: Staff['status']) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/staff/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update staff status')
      }

      setSuccessMessage(`${item.name} marked as ${status}`)
      await fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update staff status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (value: string, row: Staff) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.position}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'department',
      label: 'Department',
      width: '160px',
    },
    {
      key: 'phone',
      label: 'Phone',
      width: '150px',
    },
    {
      key: 'email',
      label: 'Email',
      render: (value: string) => <span className="block max-w-[240px] truncate">{value}</span>,
      width: '240px',
    },
    {
      key: 'joinDate',
      label: 'Join Date',
      render: (value: string) => formatDate(value),
      width: '140px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: Staff['status']) => <StatusBadge status={value} />,
      width: '120px',
    },
    {
      key: 'id',
      label: 'Quick Action',
      render: (_value: string, row: Staff) => (
        <div className="flex flex-wrap gap-2">
          {row.status === 'active' ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'inactive')}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'active')}
            >
              Activate
            </Button>
          )}
        </div>
      ),
      width: '140px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.STAFF_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Staff Management"
          description="Manage non-teaching staff records, monitor departments, and control active workforce status from one operations panel."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchStaff()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Staff"
            value={stats.total}
            description="All registered staff profiles"
            icon={<Users2 className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Active"
            value={stats.activeCount}
            description="Currently working members"
            icon={<BadgeCheck className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Departments"
            value={stats.uniqueDepartments}
            description="Distinct staff units"
            icon={<Building2 className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Recent Joiners"
            value={stats.recentJoiners}
            description="Joined within the last 30 days"
            icon={<CalendarRange className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Staff Registry</CardTitle>
              <CardDescription>Search, review, edit, and manage operational staff records and status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, position, department, phone, email or status"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {filteredStaff.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredStaff}
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
                <CardTitle>Recent Joiners</CardTitle>
                <CardDescription>Newest staff additions to the organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentJoiners.length === 0 ? (
                  <EmptyMiniState message="No staff records available yet." />
                ) : (
                  recentJoiners.map(item => (
                    <MiniStaffRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.position} · ${item.department || 'No department'}`}
                      trailing={formatDate(item.joinDate)}
                      badge={<StatusBadge status={item.status} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Department Snapshot</CardTitle>
                <CardDescription>Where operational staff are distributed right now.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {departmentSummary.length === 0 ? (
                  <EmptyMiniState message="No department data available yet." />
                ) : (
                  departmentSummary.map(([department, count]) => (
                    <QueueRow
                      key={department}
                      label={department}
                      value={count}
                      helper="Assigned staff members"
                      icon={<Building2 className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Department counts update from the live staff registry.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('active')}>
                  View Active Staff
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Operations Pulse</CardTitle>
                <CardDescription>Quick signals for staff administration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniMetric
                  label="Active staff"
                  helper="Currently operational"
                  value={stats.activeCount}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />
                <MiniMetric
                  label="Inactive staff"
                  helper="Need review or reactivation"
                  value={stats.inactiveCount}
                  icon={<ShieldAlert className="h-4 w-4" />}
                />
                <MiniMetric
                  label="Contact-ready"
                  helper="Phone and email visible in registry"
                  value={staff.filter(item => item.phone && item.email).length}
                  icon={<Phone className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <StaffFormModal
          isEdit={Boolean(selectedStaff)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <StaffViewModal
          staff={isViewOpen ? selectedStaff : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedStaff(null)
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

function StatusBadge({ status }: { status: Staff['status'] }) {
  return <Badge variant={status === 'active' ? 'default' : 'outline'}>{status === 'active' ? 'Active' : 'Inactive'}</Badge>
}

function MiniStaffRow({
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

function MiniMetric({
  label,
  helper,
  value,
  icon,
}: {
  label: string
  helper: string
  value: number
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

function StaffFormModal({
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
  values: StaffFormValues
  onClose: () => void
  onChange: (field: keyof StaffFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Staff' : 'Add Staff'}
      description="Create a new staff record or revise contact details, department, role, join date, and workforce status."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label="Position" value={values.position} onChange={value => onChange('position', value)} required />
          <Field label="Department" value={values.department} onChange={value => onChange('department', value)} required />
          <Field label="Phone" value={values.phone} onChange={value => onChange('phone', value)} required />
          <Field label="Email" type="email" value={values.email} onChange={value => onChange('email', value)} required />
          <Field label="Join Date" type="date" value={values.joinDate} onChange={value => onChange('joinDate', value)} required />
          <SelectField
            label="Status"
            value={values.status}
            onChange={value => onChange('status', value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            placeholder="Select status"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Staff' : 'Create Staff'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function StaffViewModal({
  staff,
  onClose,
  onEdit,
}: {
  staff: Staff | null
  onClose: () => void
  onEdit: (staff: Staff) => void
}) {
  if (!staff) return null

  const rows = [
    { label: 'Name', value: staff.name },
    { label: 'Position', value: staff.position || '-' },
    { label: 'Department', value: staff.department || '-' },
    { label: 'Phone', value: staff.phone || '-' },
    { label: 'Email', value: staff.email || '-' },
    { label: 'Join Date', value: formatDate(staff.joinDate) },
    { label: 'Status', value: staff.status === 'active' ? 'Active' : 'Inactive' },
  ]

  return (
    <ModalShell title="Staff Details" description="Review the selected staff record before updating it." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(staff)}>
          Edit Staff
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

function isRecentDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 30
}
