'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  BookOpenText,
  CalendarRange,
  Landmark,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  WalletCards,
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
import type { AccountTransaction } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type AccountFormValues = {
  title: string
  type: AccountTransaction['type']
  amount: string
  category: string
  date: string
  note: string
}

const emptyForm: AccountFormValues = {
  title: '',
  type: 'income',
  amount: '',
  category: '',
  date: '',
  note: '',
}

export default function AccountsPage() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<AccountTransaction | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<AccountFormValues>(emptyForm)

  useEffect(() => {
    void fetchTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return transactions.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'income' && item.type === 'income') ||
        (activeTab === 'expense' && item.type === 'expense') ||
        (activeTab === 'recent' && isRecentDate(item.date))

      if (!matchesTab) return false
      if (!term) return true

      return [item.title, item.type, item.category, item.note, String(item.amount), item.date]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, searchTerm, transactions])

  const stats = useMemo(() => {
    const income = transactions
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0)
    const expense = transactions
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0)

    return {
      total: transactions.length,
      incomeCount: transactions.filter(item => item.type === 'income').length,
      expenseCount: transactions.filter(item => item.type === 'expense').length,
      income,
      expense,
      balance: income - expense,
    }
  }, [transactions])

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 5),
    [transactions]
  )

  const topExpenses = useMemo(
    () =>
      [...transactions]
        .filter(item => item.type === 'expense')
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 5),
    [transactions]
  )

  const categorySummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of transactions) {
      summary.set(item.category, (summary.get(item.category) ?? 0) + item.amount)
    }

    return [...summary.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
  }, [transactions])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/accounts', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load account transactions')
      }

      setTransactions(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account transactions')
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
    setSelectedTransaction(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: AccountTransaction) => {
    resetMessages()
    setSelectedTransaction(item)
    setFormValues({
      title: item.title,
      type: item.type,
      amount: String(item.amount),
      category: item.category,
      date: item.date,
      note: item.note,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: AccountTransaction) => {
    setSelectedTransaction(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedTransaction(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof AccountFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedTransaction ? `/api/accounts/${selectedTransaction.id}` : '/api/accounts'
      const method = selectedTransaction ? 'PUT' : 'POST'
      const payload = {
        title: formValues.title.trim(),
        type: formValues.type,
        amount: Number(formValues.amount),
        category: formValues.category.trim(),
        date: formValues.date,
        note: formValues.note.trim(),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save account transaction')
      }

      setSuccessMessage(data.message || 'Transaction saved successfully')
      setIsFormOpen(false)
      setSelectedTransaction(null)
      setFormValues(emptyForm)
      await fetchTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: AccountTransaction) => {
    resetMessages()

    if (!confirm(`Delete transaction "${item.title}"?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/accounts/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete transaction')
      }

      setSuccessMessage(data.message || 'Transaction deleted successfully')
      await fetchTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: 'Transaction',
      render: (value: string, row: AccountTransaction) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.category}</p>
        </div>
      ),
      width: '240px',
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: AccountTransaction['type']) => <TypeBadge type={value} />,
      width: '120px',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: AccountTransaction) => (
        <span className={cn('font-medium', row.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
          {formatCurrency(value)}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'date',
      label: 'Date',
      render: (value: string) => formatDate(value),
      width: '140px',
    },
    {
      key: 'note',
      label: 'Note',
      render: (value: string) => (
        <span className="block max-w-[260px] truncate text-muted-foreground">{value || '-'}</span>
      ),
      width: '260px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.ACCOUNTS_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Accounts Management"
          description="Manage financial accounts, track income and expenses, and monitor category-wise cashflow from one finance ledger."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchTransactions()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Net Balance"
            value={formatCurrency(stats.balance)}
            description="Income minus total expense"
            icon={<WalletCards className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Income"
            value={formatCurrency(stats.income)}
            description={`${stats.incomeCount} incoming entries`}
            icon={<ArrowUpCircle className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Expense"
            value={formatCurrency(stats.expense)}
            description={`${stats.expenseCount} outgoing entries`}
            icon={<ArrowDownCircle className="h-4 w-4" />}
            accent="rose"
          />
          <StatCard
            title="Transactions"
            value={stats.total}
            description="Ledger records available"
            icon={<BadgeDollarSign className="h-4 w-4" />}
            accent="amber"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Transaction Ledger</CardTitle>
              <CardDescription>Search, review, edit, and manage income and expense activity across all categories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by title, type, category, note, amount or date"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ReceiptText className="h-4 w-4" />
                      {filteredTransactions.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredTransactions}
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
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest ledger movement across all accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <EmptyMiniState message="No transactions available yet." />
                ) : (
                  recentTransactions.map(item => (
                    <MiniTransactionRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.category} · ${formatDate(item.date)}`}
                      trailing={formatCurrency(item.amount)}
                      badge={<TypeBadge type={item.type} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Expense Watchlist</CardTitle>
                <CardDescription>Largest outgoing transactions for quick review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topExpenses.length === 0 ? (
                  <EmptyMiniState message="No expense entries yet." />
                ) : (
                  topExpenses.map(item => (
                    <MiniTransactionRow
                      key={item.id}
                      title={item.title}
                      subtitle={`${item.category} · ${item.note || 'No note'}`}
                      trailing={formatCurrency(item.amount)}
                      badge={<TypeBadge type={item.type} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">High-value expense items stay visible here for faster review.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('expense')}>
                  View Expenses
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Category Snapshot</CardTitle>
                <CardDescription>Top transaction categories by gross amount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categorySummary.length === 0 ? (
                  <EmptyMiniState message="No category data available yet." />
                ) : (
                  categorySummary.map(([category, amount]) => (
                    <QueueRow
                      key={category}
                      label={category}
                      value={formatCurrency(amount)}
                      helper="Combined transaction amount"
                      icon={<BookOpenText className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <AccountFormModal
          isEdit={Boolean(selectedTransaction)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <AccountViewModal
          transaction={isViewOpen ? selectedTransaction : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedTransaction(null)
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

function TypeBadge({ type }: { type: AccountTransaction['type'] }) {
  return <Badge variant={type === 'income' ? 'default' : 'outline'}>{type === 'income' ? 'Income' : 'Expense'}</Badge>
}

function MiniTransactionRow({
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
  value: string
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
      <span className="text-sm font-semibold text-foreground">{value}</span>
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

function AccountFormModal({
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
  values: AccountFormValues
  onClose: () => void
  onChange: (field: keyof AccountFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      description="Create a ledger entry or update amount, category, date, note, and cashflow type."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" value={values.title} onChange={value => onChange('title', value)} required />
          <SelectField
            label="Type"
            value={values.type}
            onChange={value => onChange('type', value)}
            options={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
            placeholder="Select type"
            required
          />
          <Field label="Amount" type="number" value={values.amount} onChange={value => onChange('amount', value)} required />
          <Field label="Category" value={values.category} onChange={value => onChange('category', value)} required />
          <Field label="Date" type="date" value={values.date} onChange={value => onChange('date', value)} required />
          <TextAreaField label="Note" value={values.note} onChange={value => onChange('note', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Transaction' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function AccountViewModal({
  transaction,
  onClose,
  onEdit,
}: {
  transaction: AccountTransaction | null
  onClose: () => void
  onEdit: (transaction: AccountTransaction) => void
}) {
  if (!transaction) return null

  const rows = [
    { label: 'Title', value: transaction.title },
    { label: 'Type', value: transaction.type === 'income' ? 'Income' : 'Expense' },
    { label: 'Amount', value: formatCurrency(transaction.amount) },
    { label: 'Category', value: transaction.category },
    { label: 'Date', value: formatDate(transaction.date) },
    { label: 'Note', value: transaction.note || '-' },
  ]

  return (
    <ModalShell title="Transaction Details" description="Review the selected financial ledger entry." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(transaction)}>
          Edit Transaction
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
        value={value}
        rows={4}
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

function isRecentDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 30
}
