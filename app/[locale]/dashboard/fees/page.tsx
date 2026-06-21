'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  Wallet,
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
import type { Fee, Student } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type FeeRecord = Fee & {
  studentName?: string
  className?: string
  parentName?: string
}

type FeeFormValues = {
  studentId: string
  month: string
  amount: string
  dueDate: string
  status: Fee['status']
}

const emptyForm: FeeFormValues = {
  studentId: '',
  month: '',
  amount: '',
  dueDate: '',
  status: 'pending',
}

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<FeeFormValues>(emptyForm)

  useEffect(() => {
    void fetchPageData()
  }, [])

  const studentMap = useMemo(
    () => new Map(students.map(student => [student.rollNumber, student])),
    [students]
  )

  const hydratedFees = useMemo<FeeRecord[]>(
    () =>
      fees.map(fee => {
        const student = studentMap.get(fee.studentId)
        return {
          ...fee,
          studentName: student?.name ?? 'Unknown student',
          className: student ? `${student.class} - ${student.section}` : 'Unassigned',
          parentName: student?.parentName ?? '-',
        }
      }),
    [fees, studentMap]
  )

  const filteredFees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return hydratedFees.filter(fee => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && fee.status === 'pending') ||
        (activeTab === 'paid' && fee.status === 'paid') ||
        (activeTab === 'partial' && fee.status === 'partial') ||
        (activeTab === 'overdue' && fee.status !== 'paid' && isOverdue(fee.dueDate))

      if (!matchesTab) return false
      if (!term) return true

      return [
        fee.studentName ?? '',
        fee.studentId,
        fee.month,
        fee.className ?? '',
        fee.status,
        String(fee.amount),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, hydratedFees, searchTerm])

  const stats = useMemo(() => {
    const totalCollection = hydratedFees
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0)
    const pendingCollection = hydratedFees
      .filter(fee => fee.status !== 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0)
    const overdueCount = hydratedFees.filter(
      fee => fee.status !== 'paid' && isOverdue(fee.dueDate)
    ).length

    return {
      total: hydratedFees.length,
      paid: hydratedFees.filter(fee => fee.status === 'paid').length,
      pending: hydratedFees.filter(fee => fee.status === 'pending').length,
      partial: hydratedFees.filter(fee => fee.status === 'partial').length,
      overdueCount,
      totalCollection,
      pendingCollection,
    }
  }, [hydratedFees])

  const recentDueFees = useMemo(
    () =>
      [...hydratedFees]
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
        .slice(0, 5),
    [hydratedFees]
  )

  const topOutstanding = useMemo(
    () =>
      [...hydratedFees]
        .filter(fee => fee.status !== 'paid')
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 5),
    [hydratedFees]
  )

  const fetchPageData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [feesRes, studentsRes] = await Promise.all([
        fetch('/api/fees', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
      ])

      const [feesData, studentsData] = await Promise.all([
        feesRes.json(),
        studentsRes.json(),
      ])

      if (!feesRes.ok || !feesData.success) {
        throw new Error(feesData.message || 'Failed to load fee records')
      }

      if (!studentsRes.ok || !studentsData.success) {
        throw new Error(studentsData.message || 'Failed to load student directory')
      }

      setFees(feesData.data)
      setStudents(studentsData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fee management data')
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
    setSelectedFee(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (fee: FeeRecord) => {
    resetMessages()
    setSelectedFee(fee)
    setFormValues({
      studentId: fee.studentId,
      month: fee.month,
      amount: String(fee.amount),
      dueDate: fee.dueDate,
      status: fee.status,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (fee: FeeRecord) => {
    setSelectedFee(fee)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedFee(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof FeeFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const isEdit = Boolean(selectedFee)
      const endpoint = isEdit ? `/api/fees/${selectedFee?.id}` : '/api/fees'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        studentId: formValues.studentId,
        month: formValues.month.trim(),
        amount: Number(formValues.amount),
        dueDate: formValues.dueDate,
        status: formValues.status,
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save fee record')
      }

      setSuccessMessage(data.message || 'Fee saved successfully')
      setIsFormOpen(false)
      setSelectedFee(null)
      setFormValues(emptyForm)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fee record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (fee: FeeRecord) => {
    resetMessages()

    if (!confirm(`Delete ${fee.studentName}'s ${fee.month} fee record?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/fees/${fee.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete fee record')
      }

      setSuccessMessage(data.message || 'Fee deleted successfully')
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fee record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (fee: FeeRecord, status: Fee['status']) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/fees/${fee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update fee status')
      }

      setSuccessMessage(`Fee marked as ${status}`)
      await fetchPageData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fee status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'studentName',
      label: 'Student',
      render: (_value: string, row: FeeRecord) => (
        <div>
          <p className="font-medium text-foreground">{row.studentName}</p>
          <p className="text-xs text-muted-foreground">{row.studentId}</p>
        </div>
      ),
      width: '220px',
    },
    { key: 'className', label: 'Class', width: '140px' },
    { key: 'month', label: 'Billing Month', width: '140px' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => formatCurrency(value),
      width: '130px',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value: string, row: FeeRecord) => (
        <div>
          <p>{formatDate(value)}</p>
          {row.status !== 'paid' && isOverdue(value) ? (
            <p className="text-xs text-destructive">Overdue</p>
          ) : null}
        </div>
      ),
      width: '150px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: Fee['status']) => <StatusBadge status={value} />,
      width: '130px',
    },
    {
      key: 'id',
      label: 'Collection',
      render: (_value: string, row: FeeRecord) => (
        <div className="flex flex-wrap gap-2">
          {row.status !== 'paid' ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'paid')}
            >
              Mark Paid
            </Button>
          ) : null}
          {row.status === 'pending' ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'partial')}
            >
              Partial
            </Button>
          ) : null}
          {row.status !== 'pending' ? (
            <Button
              variant="ghost"
              size="xs"
              disabled={submitting}
              onClick={() => handleStatusUpdate(row, 'pending')}
            >
              Reopen
            </Button>
          ) : null}
        </div>
      ),
      width: '210px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.FEE_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Fee Management"
          description="Track collections, pending balances, overdue students, and monthly billing activity from one finance desk."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchPageData()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Fee
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Collected"
            value={formatCurrency(stats.totalCollection)}
            description={`${stats.paid} paid records cleared`}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Pending"
            value={formatCurrency(stats.pendingCollection)}
            description={`${stats.pending} pending and ${stats.partial} partial`}
            icon={<Wallet className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueCount}
            description="Fees already past due date"
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="rose"
          />
          <StatCard
            title="Total Records"
            value={stats.total}
            description="Billing entries in the registry"
            icon={<BadgeDollarSign className="h-4 w-4" />}
            accent="sky"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Collection Registry</CardTitle>
              <CardDescription>Search, review, edit, and update payment status for each fee record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="partial">Partial</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by student, ID, month, amount, class or status"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      {filteredFees.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredFees}
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
                <CardTitle>Upcoming Due Dates</CardTitle>
                <CardDescription>Quick look at the next fee deadlines.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDueFees.length === 0 ? (
                  <EmptyMiniState message="No fee records available yet." />
                ) : (
                  recentDueFees.map(fee => (
                    <MiniFeeRow
                      key={fee.id}
                      title={fee.studentName || fee.studentId}
                      subtitle={`${fee.month} · ${fee.className}`}
                      trailing={formatDate(fee.dueDate)}
                      badge={<StatusBadge status={fee.status} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Outstanding Watchlist</CardTitle>
                <CardDescription>Highest pending balances needing follow-up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topOutstanding.length === 0 ? (
                  <EmptyMiniState message="No outstanding records right now." />
                ) : (
                  topOutstanding.map(fee => (
                    <MiniFeeRow
                      key={fee.id}
                      title={fee.studentName || fee.studentId}
                      subtitle={`${fee.month} · ${fee.parentName}`}
                      trailing={formatCurrency(fee.amount)}
                      badge={
                        fee.status !== 'paid' && isOverdue(fee.dueDate) ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <StatusBadge status={fee.status} />
                        )
                      }
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Use quick actions in the table to clear payment status fast.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('overdue')}>
                  Review Overdue
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Finance Pulse</CardTitle>
                <CardDescription>Small operational indicators for the fee desk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueueRow
                  label="Pending items"
                  value={stats.pending}
                  helper="Awaiting full payment"
                  icon={<CalendarClock className="h-4 w-4" />}
                />
                <QueueRow
                  label="Partial payments"
                  value={stats.partial}
                  helper="Need follow-up collection"
                  icon={<CreditCard className="h-4 w-4" />}
                />
                <QueueRow
                  label="Paid entries"
                  value={stats.paid}
                  helper="Closed successfully"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <FeeFormModal
          students={students}
          isEdit={Boolean(selectedFee)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <FeeViewModal
          fee={isViewOpen ? selectedFee : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedFee(null)
          }}
          onEdit={fee => {
            setIsViewOpen(false)
            openEditModal(fee)
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

function StatusBadge({ status }: { status: Fee['status'] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  if (status === 'paid') {
    return <Badge variant="default">{label}</Badge>
  }

  if (status === 'partial') {
    return <Badge variant="secondary">{label}</Badge>
  }

  return <Badge variant="outline">{label}</Badge>
}

function MiniFeeRow({
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

function FeeFormModal({
  students,
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
}: {
  students: Student[]
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: FeeFormValues
  onClose: () => void
  onChange: (field: keyof FeeFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Fee Record' : 'Add Fee Record'}
      description="Create a new billing record or update payment amount, due date, month and collection status."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Student"
            value={values.studentId}
            onChange={value => onChange('studentId', value)}
            required
            options={students.map(student => ({
              key: student.id,
              value: student.rollNumber,
              label: `${student.name} (${student.rollNumber})`,
            }))}
            placeholder="Select a student"
          />
          <Field label="Billing Month" value={values.month} onChange={value => onChange('month', value)} required />
          <Field
            label="Amount"
            type="number"
            value={values.amount}
            onChange={value => onChange('amount', value)}
            required
          />
          <Field
            label="Due Date"
            type="date"
            value={values.dueDate}
            onChange={value => onChange('dueDate', value)}
            required
          />
          <SelectField
            label="Status"
            value={values.status}
            onChange={value => onChange('status', value)}
            required
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
            ]}
            placeholder="Select status"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Fee' : 'Create Fee'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function FeeViewModal({
  fee,
  onClose,
  onEdit,
}: {
  fee: FeeRecord | null
  onClose: () => void
  onEdit: (fee: FeeRecord) => void
}) {
  if (!fee) return null

  const rows = [
    { label: 'Student', value: fee.studentName || fee.studentId },
    { label: 'Student ID', value: fee.studentId },
    { label: 'Class', value: fee.className || '-' },
    { label: 'Parent', value: fee.parentName || '-' },
    { label: 'Billing Month', value: fee.month },
    { label: 'Amount', value: formatCurrency(fee.amount) },
    { label: 'Due Date', value: formatDate(fee.dueDate) },
    { label: 'Status', value: fee.status.toUpperCase() },
  ]

  return (
    <ModalShell title="Fee Details" description="Review the selected fee record before making changes." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(fee)}>
          Edit Fee
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
  options: Array<{ key?: string; label: string; value: string }>
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
          <option key={option.key ?? `${option.value}-${option.label}`} value={option.value}>
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

function isOverdue(value: string) {
  const dueDate = new Date(value)

  if (Number.isNaN(dueDate.getTime())) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  return dueDate.getTime() < today.getTime()
}
