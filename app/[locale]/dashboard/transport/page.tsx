'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bus,
  ClipboardList,
  MapPinned,
  Phone,
  Plus,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  UserRound,
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
import type { Transport } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type TransportFormValues = {
  routeName: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  fee: string
}

const emptyForm: TransportFormValues = {
  routeName: '',
  vehicleNo: '',
  driverName: '',
  driverPhone: '',
  fee: '',
}

export default function TransportPage() {
  const [routes, setRoutes] = useState<Transport[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoute, setSelectedRoute] = useState<Transport | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<TransportFormValues>(emptyForm)

  useEffect(() => {
    void fetchRoutes()
  }, [])

  const filteredRoutes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return routes.filter(item => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'withDriver' && Boolean(item.driverName.trim())) ||
        (activeTab === 'withoutDriver' && !item.driverName.trim()) ||
        (activeTab === 'highFee' && item.fee >= 2000)

      if (!matchesTab) return false
      if (!term) return true

      return [item.routeName, item.vehicleNo, item.driverName, item.driverPhone, String(item.fee)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, routes, searchTerm])

  const stats = useMemo(() => {
    const totalFees = routes.reduce((sum, item) => sum + item.fee, 0)
    const withDriver = routes.filter(item => item.driverName.trim()).length
    const withoutDriver = routes.length - withDriver
    const averageFee = routes.length > 0 ? Math.round(totalFees / routes.length) : 0

    return {
      totalRoutes: routes.length,
      totalFees,
      averageFee,
      withDriver,
      withoutDriver,
    }
  }, [routes])

  const topFeeRoutes = useMemo(
    () =>
      [...routes]
        .sort((left, right) => right.fee - left.fee)
        .slice(0, 5),
    [routes]
  )

  const driverCoverage = useMemo(
    () =>
      [...routes]
        .sort((left, right) => {
          const leftHasDriver = left.driverName.trim() ? 1 : 0
          const rightHasDriver = right.driverName.trim() ? 1 : 0
          return leftHasDriver - rightHasDriver
        })
        .slice(0, 5),
    [routes]
  )

  const vehiclePrefixSummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of routes) {
      const prefix = item.vehicleNo.split('-')[0]?.trim() || 'Unknown'
      summary.set(prefix, (summary.get(prefix) ?? 0) + 1)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [routes])

  const fetchRoutes = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/transport', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load transport routes')
      }

      setRoutes(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transport routes')
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
    setSelectedRoute(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Transport) => {
    resetMessages()
    setSelectedRoute(item)
    setFormValues({
      routeName: item.routeName,
      vehicleNo: item.vehicleNo,
      driverName: item.driverName,
      driverPhone: item.driverPhone,
      fee: String(item.fee),
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Transport) => {
    setSelectedRoute(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedRoute(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof TransportFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedRoute ? `/api/transport/${selectedRoute.id}` : '/api/transport'
      const method = selectedRoute ? 'PUT' : 'POST'
      const payload = {
        routeName: formValues.routeName.trim(),
        vehicleNo: formValues.vehicleNo.trim(),
        driverName: formValues.driverName.trim(),
        driverPhone: formValues.driverPhone.trim(),
        fee: Number(formValues.fee || '0'),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save transport route')
      }

      setSuccessMessage(data.message || 'Transport route saved successfully')
      setIsFormOpen(false)
      setSelectedRoute(null)
      setFormValues(emptyForm)
      await fetchRoutes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transport route')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Transport) => {
    resetMessages()

    if (!confirm(`Delete route ${item.routeName}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/transport/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete transport route')
      }

      setSuccessMessage(data.message || 'Transport route deleted successfully')
      await fetchRoutes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transport route')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'routeName',
      label: 'Route',
      render: (value: string, row: Transport) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.vehicleNo}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'driverName',
      label: 'Driver',
      render: (value: string, row: Transport) => (
        <div>
          <p>{value || 'Unassigned'}</p>
          <p className="text-xs text-muted-foreground">{row.driverPhone || '-'}</p>
        </div>
      ),
      width: '200px',
    },
    {
      key: 'vehicleNo',
      label: 'Vehicle No',
      width: '150px',
    },
    {
      key: 'fee',
      label: 'Route Fee',
      render: (value: number) => formatCurrency(value),
      width: '140px',
    },
    {
      key: 'id',
      label: 'Coverage',
      render: (_value: string, row: Transport) => (
        <DriverBadge hasDriver={Boolean(row.driverName.trim())} />
      ),
      width: '130px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.TRANSPORT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Transport Management"
          description="Manage school transport, monitor route coverage, maintain vehicle and driver details, and track route fee structure from one workspace."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchRoutes()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Route
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Routes"
            value={stats.totalRoutes}
            description="Registered transport routes"
            icon={<Route className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Driver Assigned"
            value={stats.withDriver}
            description={`${stats.withoutDriver} routes still unassigned`}
            icon={<ShieldCheck className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Average Fee"
            value={formatCurrency(stats.averageFee)}
            description="Average student transport charge"
            icon={<Wallet className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Route Fees"
            value={formatCurrency(stats.totalFees)}
            description="Combined listed route charges"
            icon={<Bus className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Transport Registry</CardTitle>
              <CardDescription>Search, review, edit, and maintain route, vehicle, driver, and route fee details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="withDriver">Assigned Driver</TabsTrigger>
                  <TabsTrigger value="withoutDriver">No Driver</TabsTrigger>
                  <TabsTrigger value="highFee">High Fee</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by route, vehicle, driver, phone or fee"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPinned className="h-4 w-4" />
                      {filteredRoutes.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredRoutes}
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
                <CardTitle>Top Fee Routes</CardTitle>
                <CardDescription>Routes with the highest listed transport charge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topFeeRoutes.length === 0 ? (
                  <EmptyMiniState message="No transport routes available yet." />
                ) : (
                  topFeeRoutes.map(item => (
                    <MiniTransportRow
                      key={item.id}
                      title={item.routeName}
                      subtitle={`${item.vehicleNo} · ${item.driverName || 'No driver assigned'}`}
                      trailing={formatCurrency(item.fee)}
                      badge={<Badge variant="outline">Fee</Badge>}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Driver Coverage</CardTitle>
                <CardDescription>Quick look at assignment status across routes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {driverCoverage.length === 0 ? (
                  <EmptyMiniState message="No transport coverage data available yet." />
                ) : (
                  driverCoverage.map(item => (
                    <MiniTransportRow
                      key={item.id}
                      title={item.routeName}
                      subtitle={`${item.vehicleNo} · ${item.driverPhone || 'No phone listed'}`}
                      trailing={item.driverName || 'Pending'}
                      badge={<DriverBadge hasDriver={Boolean(item.driverName.trim())} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Routes without drivers remain visible here for follow-up.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('withoutDriver')}>
                  Review Unassigned
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Vehicle Prefix Snapshot</CardTitle>
                <CardDescription>Simple grouping based on vehicle number prefix.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehiclePrefixSummary.length === 0 ? (
                  <EmptyMiniState message="No vehicle summary available yet." />
                ) : (
                  vehiclePrefixSummary.map(([prefix, count]) => (
                    <QueueRow
                      key={prefix}
                      label={prefix}
                      value={count}
                      helper="Vehicles using this prefix"
                      icon={<ClipboardList className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <TransportFormModal
          isEdit={Boolean(selectedRoute)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <TransportViewModal
          route={isViewOpen ? selectedRoute : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedRoute(null)
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

function DriverBadge({ hasDriver }: { hasDriver: boolean }) {
  return <Badge variant={hasDriver ? 'default' : 'outline'}>{hasDriver ? 'Assigned' : 'Unassigned'}</Badge>
}

function MiniTransportRow({
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

function TransportFormModal({
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
  values: TransportFormValues
  onClose: () => void
  onChange: (field: keyof TransportFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Transport Route' : 'Add Transport Route'}
      description="Create a route or update vehicle, driver, contact number, and route fee details."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Route Name" value={values.routeName} onChange={value => onChange('routeName', value)} required />
          <Field label="Vehicle No" value={values.vehicleNo} onChange={value => onChange('vehicleNo', value)} required />
          <Field label="Driver Name" value={values.driverName} onChange={value => onChange('driverName', value)} />
          <Field label="Driver Phone" value={values.driverPhone} onChange={value => onChange('driverPhone', value)} />
          <Field label="Route Fee" type="number" value={values.fee} onChange={value => onChange('fee', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Route' : 'Create Route'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function TransportViewModal({
  route,
  onClose,
  onEdit,
}: {
  route: Transport | null
  onClose: () => void
  onEdit: (route: Transport) => void
}) {
  if (!route) return null

  const rows = [
    { label: 'Route Name', value: route.routeName },
    { label: 'Vehicle No', value: route.vehicleNo },
    { label: 'Driver Name', value: route.driverName || '-' },
    { label: 'Driver Phone', value: route.driverPhone || '-' },
    { label: 'Route Fee', value: formatCurrency(route.fee) },
  ]

  return (
    <ModalShell title="Transport Route Details" description="Review the selected route before making changes." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(route)}>
          Edit Route
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value)
}
