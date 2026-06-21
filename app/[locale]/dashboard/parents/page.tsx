'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  GraduationCap,
  Home,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
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
import type { Parent } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type ParentFormValues = {
  name: string
  phone: string
  email: string
  occupation: string
  address: string
}

const emptyForm: ParentFormValues = {
  name: '',
  phone: '',
  email: '',
  occupation: '',
  address: '',
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<ParentFormValues>(emptyForm)

  useEffect(() => {
    void fetchParents()
  }, [])

  const filteredParents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return parents.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'withChildren' && item.children > 0) ||
        (activeTab === 'singleChild' && item.children === 1) ||
        (activeTab === 'multipleChildren' && item.children > 1)

      if (!matchesTab) return false
      if (!term) return true

      return [item.name, item.phone, item.email, item.occupation, item.address, String(item.children)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, parents, searchTerm])

  const stats = useMemo(() => {
    const totalChildrenLinked = parents.reduce((sum, item) => sum + item.children, 0)
    const withChildren = parents.filter(item => item.children > 0).length
    const multipleChildren = parents.filter(item => item.children > 1).length
    const withOccupation = parents.filter(item => item.occupation.trim()).length

    return {
      total: parents.length,
      totalChildrenLinked,
      withChildren,
      multipleChildren,
      withOccupation,
    }
  }, [parents])

  const highestLinkedParents = useMemo(
    () =>
      [...parents]
        .sort((left, right) => right.children - left.children)
        .slice(0, 5),
    [parents]
  )

  const occupationSummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of parents) {
      const occupation = item.occupation.trim() || 'Unspecified'
      summary.set(occupation, (summary.get(occupation) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [parents])

  const fetchParents = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/parents', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load parent records')
      }

      setParents(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parent records')
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
    setSelectedParent(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Parent) => {
    resetMessages()
    setSelectedParent(item)
    setFormValues({
      name: item.name,
      phone: item.phone,
      email: item.email,
      occupation: item.occupation,
      address: item.address,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Parent) => {
    setSelectedParent(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedParent(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof ParentFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedParent ? `/api/parents/${selectedParent.id}` : '/api/parents'
      const method = selectedParent ? 'PUT' : 'POST'
      const payload = {
        name: formValues.name.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        occupation: formValues.occupation.trim(),
        address: formValues.address.trim(),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save parent record')
      }

      setSuccessMessage(data.message || 'Parent saved successfully')
      setIsFormOpen(false)
      setSelectedParent(null)
      setFormValues(emptyForm)
      await fetchParents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save parent record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Parent) => {
    resetMessages()

    if (!confirm(`Delete ${item.name}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/parents/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete parent record')
      }

      setSuccessMessage(data.message || 'Parent deleted successfully')
      await fetchParents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete parent record')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Parent',
      render: (value: string, row: Parent) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.occupation || 'Occupation not set'}</p>
        </div>
      ),
      width: '220px',
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
      key: 'address',
      label: 'Address',
      render: (value: string) => <span className="block max-w-[260px] truncate">{value || '-'}</span>,
      width: '260px',
    },
    {
      key: 'children',
      label: 'Children',
      render: (value: number) => <ChildrenBadge count={value} />,
      width: '120px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.PARENT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Parent Management"
          description="Manage parent information, review linked children counts, and keep guardian contact records organized from one control panel."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchParents()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Parent
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Parents"
            value={stats.total}
            description="Guardian profiles in system"
            icon={<UsersRound className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Linked Children"
            value={stats.totalChildrenLinked}
            description={`${stats.withChildren} parents linked to at least one student`}
            icon={<GraduationCap className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Multi-Child Families"
            value={stats.multipleChildren}
            description="Parents connected to more than one student"
            icon={<ShieldCheck className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Occupation Filled"
            value={stats.withOccupation}
            description="Profiles with occupation data"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Parent Registry</CardTitle>
              <CardDescription>Search, review, edit, and maintain guardian profiles and household contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="withChildren">Linked</TabsTrigger>
                  <TabsTrigger value="singleChild">Single Child</TabsTrigger>
                  <TabsTrigger value="multipleChildren">Multiple Children</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, phone, email, occupation, address or children count"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {filteredParents.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredParents}
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
                <CardTitle>Top Linked Parents</CardTitle>
                <CardDescription>Parents currently connected to the most children.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {highestLinkedParents.length === 0 ? (
                  <EmptyMiniState message="No parent records available yet." />
                ) : (
                  highestLinkedParents.map(item => (
                    <MiniParentRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.phone} · ${item.occupation || 'Occupation not set'}`}
                      trailing={`${item.children} child${item.children === 1 ? '' : 'ren'}`}
                      badge={<ChildrenBadge count={item.children} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Occupation Snapshot</CardTitle>
                <CardDescription>Common parent occupations across registered families.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {occupationSummary.length === 0 ? (
                  <EmptyMiniState message="No occupation data available yet." />
                ) : (
                  occupationSummary.map(([occupation, count]) => (
                    <QueueRow
                      key={occupation}
                      label={occupation}
                      value={count}
                      helper="Parent profiles"
                      icon={<BriefcaseBusiness className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Occupation counts are taken from current guardian profiles.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('multipleChildren')}>
                  View Large Families
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Guardian Contact Pulse</CardTitle>
                <CardDescription>Quick contact-readiness indicators for parent communication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniMetric
                  label="Phone available"
                  helper="Profiles with contact number"
                  value={parents.filter(item => item.phone.trim()).length}
                  icon={<Phone className="h-4 w-4" />}
                />
                <MiniMetric
                  label="Email available"
                  helper="Profiles with email address"
                  value={parents.filter(item => item.email.trim()).length}
                  icon={<Mail className="h-4 w-4" />}
                />
                <MiniMetric
                  label="Address filled"
                  helper="Household address recorded"
                  value={parents.filter(item => item.address.trim()).length}
                  icon={<Home className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <ParentFormModal
          isEdit={Boolean(selectedParent)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <ParentViewModal
          parent={isViewOpen ? selectedParent : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedParent(null)
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

function ChildrenBadge({ count }: { count: number }) {
  return <Badge variant={count > 1 ? 'default' : 'outline'}>{count} child{count === 1 ? '' : 'ren'}</Badge>
}

function MiniParentRow({
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

function ParentFormModal({
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
  values: ParentFormValues
  onClose: () => void
  onChange: (field: keyof ParentFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Parent' : 'Add Parent'}
      description="Create a guardian profile or update contact details, occupation, and address information."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label="Phone" value={values.phone} onChange={value => onChange('phone', value)} required />
          <Field label="Email" type="email" value={values.email} onChange={value => onChange('email', value)} required />
          <Field label="Occupation" value={values.occupation} onChange={value => onChange('occupation', value)} />
          <TextAreaField label="Address" value={values.address} onChange={value => onChange('address', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Parent' : 'Create Parent'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function ParentViewModal({
  parent,
  onClose,
  onEdit,
}: {
  parent: Parent | null
  onClose: () => void
  onEdit: (parent: Parent) => void
}) {
  if (!parent) return null

  const rows = [
    { label: 'Name', value: parent.name },
    { label: 'Phone', value: parent.phone || '-' },
    { label: 'Email', value: parent.email || '-' },
    { label: 'Occupation', value: parent.occupation || '-' },
    { label: 'Address', value: parent.address || '-' },
    { label: 'Linked Children', value: String(parent.children) },
  ]

  return (
    <ModalShell title="Parent Details" description="Review the selected guardian profile before making updates." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(parent)}>
          Edit Parent
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
        rows={4}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  )
}
