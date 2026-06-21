'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Coins,
  HandCoins,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
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
import type { Payroll } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type PayrollFormValues = {
  employeeName: string
  employeeType: Payroll['employeeType']
  month: string
  amount: string
  status: Payroll['status']
  paidDate: string
}

const emptyForm: PayrollFormValues = {
  employeeName: '',
  employeeType: 'teacher',
  month: '',
  amount: '',
  status: 'pending',
  paidDate: '',
}

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<PayrollFormValues>(emptyForm)

  useEffect(() => {
    void fetchPayroll()
  }, [])

  const filteredPayroll = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return payroll.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && item.status === 'pending') ||
        (activeTab === 'paid' && item.status === 'paid') ||
        (activeTab === 'teachers' && item.employeeType === 'teacher') ||
        (activeTab === 'staff' && item.employeeType === 'staff')

      if (!matchesTab) return false
      if (!term) return true

      return [
        item.employeeName,
        item.employeeType,
        item.month,
        item.status,
        String(item.amount),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, payroll, searchTerm])

  const stats = useMemo(() => {
    const totalPayout = payroll.reduce((sum, item) => sum + item.amount, 0)
    const paidPayout = payroll
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + item.amount, 0)
    const pendingPayout = payroll
      .filter(item => item.status === 'pending')
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      total: payroll.length,
      paidCount: payroll.filter(item => item.status === 'paid').length,
      pendingCount: payroll.filter(item => item.status === 'pending').length,
      teacherCount: payroll.filter(item => item.employeeType === 'teacher').length,
      staffCount: payroll.filter(item => item.employeeType === 'staff').length,
      totalPayout,
      paidPayout,
      pendingPayout,
    }
  }, [payroll])

  const recentPayments = useMemo(
    () =>
      [...payroll]
        .filter(item => item.status === 'paid')
        .sort(
          (left, right) =>
            new Date(right.paidDate || right.month).getTime() -
            new Date(left.paidDate || left.month).getTime()
        )
        .slice(0, 5),
    [payroll]
  )

  const pendingQueue = useMemo(
    () =>
      [...payroll]
        .filter(item => item.status === 'pending')
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 5),
    [payroll]
  )

  const fetchPayroll = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payroll', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load payroll records')
      }

      setPayroll(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payroll records')
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
    setSelectedPayroll(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Payroll) => {
    resetMessages()
    setSelectedPayroll(item)
    setFormValues({
      employeeName: item.employeeName,
      employeeType: item.employeeType,
      month: item.month,
      amount: String(item.amount),
      status: item.status,
      paidDate: item.paidDate || '',
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Payroll) => {
    setSelectedPayroll(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedPayroll(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof PayrollFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedPayroll ? `/api/payroll/${selectedPayroll.id}` : '/api/payroll'
      const method = selectedPayroll ? 'PUT' : 'POST'
      const payload = {
        employeeName: formValues.employeeName.trim(),
        employeeType: formValues.employeeType,
        month: formValues.month.trim(),
        amount: Number(formValues.amount),
        status: formValues.status,
        paidDate: formValues.paidDate || null,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save payroll record')
      }

      setSuccessMessage(data.message || 'Payroll saved successfully')
      setIsFormOpen(false)
      setSelectedPayroll(null)
      setFormValues(emptyForm)
      await fetchPayroll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payroll record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Payroll) => {
    resetMessages()

    if (!confirm(`Delete payroll for ${item.employeeName}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/payroll/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete payroll record')
      }

      setSuccessMessage(data.message || 'Payroll deleted successfully')
      await fetchPayroll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payroll record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (item: Payroll, status: Payroll['status']) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/payroll/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paidDate: status === 'paid' ? new Date().toISOString().split('T')[0] : '',
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update payroll status')
      }

      setSuccessMessage(`Payroll marked as ${status}`)
      await fetchPayroll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payroll status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'employeeName',
      label: 'Employee',
      render: (value: string, row: Payroll) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{toEmployeeLabel(row.employeeType)}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'month',
      label: 'Payroll Month',
      width: '150px',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => formatCurrency(value),
      width: '140px',
    },
    {
      key: 'paidDate',
      label: 'Paid Date',
      render: (value: string | null) => (value ? formatDate(value) : '-'),
      width: '150px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: Payroll['status']) => <StatusBadge status={value} />,
      width: '120px',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_value: string, row: Payroll) => (
        <div className="flex flex-wrap gap-2">
          {row.status !== 'paid' ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'paid')}
            >
              Pay Now
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'pending')}
            >
              Reopen
            </Button>
          )}
        </div>
      ),
      width: '140px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.PAYROLL_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Payroll Management"
          description="Manage employee payroll, payout progress, pending salary approvals, and monthly disbursement records from one workspace."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPayroll()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Payroll
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Payroll"
            value={formatCurrency(stats.totalPayout)}
            description={`${stats.total} payroll records tracked`}
            icon={<Landmark className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Disbursed"
            value={formatCurrency(stats.paidPayout)}
            description={`${stats.paidCount} salaries already paid`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Pending"
            value={formatCurrency(stats.pendingPayout)}
            description={`${stats.pendingCount} payroll items waiting`}
            icon={<ShieldAlert className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Workforce Split"
            value={`${stats.teacherCount}/${stats.staffCount}`}
            description="Teachers vs staff entries"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Payroll Registry</CardTitle>
              <CardDescription>Search, review, edit, and close monthly salary records for teachers and staff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="teachers">Teachers</TabsTrigger>
                  <TabsTrigger value="staff">Staff</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by employee, type, month, amount or status"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HandCoins className="h-4 w-4" />
                      {filteredPayroll.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredPayroll}
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
                <CardTitle>Recent Disbursements</CardTitle>
                <CardDescription>Latest salary payments that have been completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPayments.length === 0 ? (
                  <EmptyMiniState message="No paid payroll records yet." />
                ) : (
                  recentPayments.map(item => (
                    <MiniPayrollRow
                      key={item.id}
                      title={item.employeeName}
                      subtitle={`${toEmployeeLabel(item.employeeType)} · ${item.month}`}
                      trailing={formatCurrency(item.amount)}
                      badge={<StatusBadge status={item.status} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Pending Queue</CardTitle>
                <CardDescription>Largest unpaid salary records needing action.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingQueue.length === 0 ? (
                  <EmptyMiniState message="No pending payroll items right now." />
                ) : (
                  pendingQueue.map(item => (
                    <MiniPayrollRow
                      key={item.id}
                      title={item.employeeName}
                      subtitle={`${toEmployeeLabel(item.employeeType)} · ${item.month}`}
                      trailing={formatCurrency(item.amount)}
                      badge={<StatusBadge status={item.status} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Use `Pay Now` from the registry to close an item instantly.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('pending')}>
                  Review Pending
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Payroll Pulse</CardTitle>
                <CardDescription>Operational signals for the salary desk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueueRow
                  label="Pending approvals"
                  value={stats.pendingCount}
                  helper="Awaiting payout processing"
                  icon={<CalendarClock className="h-4 w-4" />}
                />
                <QueueRow
                  label="Paid records"
                  value={stats.paidCount}
                  helper="Closed and disbursed"
                  icon={<Coins className="h-4 w-4" />}
                />
                <QueueRow
                  label="Teacher payroll"
                  value={stats.teacherCount}
                  helper="Academic staff entries"
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <PayrollFormModal
          isEdit={Boolean(selectedPayroll)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <PayrollViewModal
          payroll={isViewOpen ? selectedPayroll : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedPayroll(null)
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

function StatusBadge({ status }: { status: Payroll['status'] }) {
  return <Badge variant={status === 'paid' ? 'default' : 'outline'}>{status === 'paid' ? 'Paid' : 'Pending'}</Badge>
}

function MiniPayrollRow({
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

function PayrollFormModal({
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
  values: PayrollFormValues
  onClose: () => void
  onChange: (field: keyof PayrollFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Payroll' : 'Add Payroll'}
      description="Create a salary record or revise payout month, amount, employee type, and disbursement status."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Employee Name"
            value={values.employeeName}
            onChange={value => onChange('employeeName', value)}
            required
          />
          <SelectField
            label="Employee Type"
            value={values.employeeType}
            onChange={value => onChange('employeeType', value)}
            options={[
              { value: 'teacher', label: 'Teacher' },
              { value: 'staff', label: 'Staff' },
            ]}
            placeholder="Select employee type"
            required
          />
          <Field label="Payroll Month" value={values.month} onChange={value => onChange('month', value)} required />
          <Field label="Amount" type="number" value={values.amount} onChange={value => onChange('amount', value)} required />
          <SelectField
            label="Status"
            value={values.status}
            onChange={value => onChange('status', value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
            ]}
            placeholder="Select status"
            required
          />
          <Field
            label="Paid Date"
            type="date"
            value={values.paidDate}
            onChange={value => onChange('paidDate', value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Payroll' : 'Create Payroll'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function PayrollViewModal({
  payroll,
  onClose,
  onEdit,
}: {
  payroll: Payroll | null
  onClose: () => void
  onEdit: (payroll: Payroll) => void
}) {
  if (!payroll) return null

  const rows = [
    { label: 'Employee', value: payroll.employeeName },
    { label: 'Type', value: toEmployeeLabel(payroll.employeeType) },
    { label: 'Payroll Month', value: payroll.month },
    { label: 'Amount', value: formatCurrency(payroll.amount) },
    { label: 'Status', value: payroll.status === 'paid' ? 'Paid' : 'Pending' },
    { label: 'Paid Date', value: payroll.paidDate ? formatDate(payroll.paidDate) : '-' },
  ]

  return (
    <ModalShell title="Payroll Details" description="Review the selected salary record before making updates." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(payroll)}>
          Edit Payroll
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value)
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

function toEmployeeLabel(type: Payroll['employeeType']) {
  return type === 'teacher' ? 'Teacher' : 'Staff'
}
