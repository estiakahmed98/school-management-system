'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
  ClipboardList,
  PackageCheck,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Warehouse,
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
import type { Inventory } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type InventoryFormValues = {
  name: string
  quantity: string
  unit: string
  price: string
  note: string
}

const emptyForm: InventoryFormValues = {
  name: '',
  quantity: '',
  unit: '',
  price: '',
  note: '',
}

const LOW_STOCK_THRESHOLD = 10

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<InventoryFormValues>(emptyForm)

  useEffect(() => {
    void fetchInventory()
  }, [])

  const filteredInventory = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return inventory.filter(item => {
      const totalValue = item.quantity * item.price
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'lowStock' && item.quantity <= LOW_STOCK_THRESHOLD) ||
        (activeTab === 'inStock' && item.quantity > LOW_STOCK_THRESHOLD) ||
        (activeTab === 'highValue' && totalValue >= 5000)

      if (!matchesTab) return false
      if (!term) return true

      return [item.name, item.unit, item.note, String(item.quantity), String(item.price)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, inventory, searchTerm])

  const stats = useMemo(() => {
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const lowStockCount = inventory.filter(item => item.quantity <= LOW_STOCK_THRESHOLD).length
    const uniqueUnits = new Set(inventory.map(item => item.unit).filter(Boolean)).size

    return {
      totalItems: inventory.length,
      totalQuantity,
      totalValue,
      lowStockCount,
      uniqueUnits,
    }
  }, [inventory])

  const lowStockItems = useMemo(
    () =>
      [...inventory]
        .filter(item => item.quantity <= LOW_STOCK_THRESHOLD)
        .sort((left, right) => left.quantity - right.quantity)
        .slice(0, 5),
    [inventory]
  )

  const topValueItems = useMemo(
    () =>
      [...inventory]
        .sort((left, right) => right.quantity * right.price - left.quantity * left.price)
        .slice(0, 5),
    [inventory]
  )

  const unitSummary = useMemo(() => {
    const summary = new Map<string, number>()

    for (const item of inventory) {
      const unit = item.unit.trim() || 'Unspecified'
      summary.set(unit, (summary.get(unit) ?? 0) + item.quantity)
    }

    return [...summary.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5)
  }, [inventory])

  const fetchInventory = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load inventory items')
      }

      setInventory(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory items')
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
    setSelectedItem(null)
    setFormValues(emptyForm)
    setIsFormOpen(true)
  }

  const openEditModal = (item: Inventory) => {
    resetMessages()
    setSelectedItem(item)
    setFormValues({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      price: String(item.price),
      note: item.note,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (item: Inventory) => {
    setSelectedItem(item)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedItem(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof InventoryFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const endpoint = selectedItem ? `/api/inventory/${selectedItem.id}` : '/api/inventory'
      const method = selectedItem ? 'PUT' : 'POST'
      const payload = {
        name: formValues.name.trim(),
        quantity: Number(formValues.quantity),
        unit: formValues.unit.trim(),
        price: Number(formValues.price || '0'),
        note: formValues.note.trim(),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save inventory item')
      }

      setSuccessMessage(data.message || 'Inventory item saved successfully')
      setIsFormOpen(false)
      setSelectedItem(null)
      setFormValues(emptyForm)
      await fetchInventory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save inventory item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item: Inventory) => {
    resetMessages()

    if (!confirm(`Delete ${item.name}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete inventory item')
      }

      setSuccessMessage(data.message || 'Inventory item deleted successfully')
      await fetchInventory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory item')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Item',
      render: (value: string, row: Inventory) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{row.unit || 'No unit specified'}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value: number) => <QuantityBadge count={value} />,
      width: '140px',
    },
    {
      key: 'price',
      label: 'Unit Price',
      render: (value: number) => formatCurrency(value),
      width: '140px',
    },
    {
      key: 'id',
      label: 'Stock Value',
      render: (_value: string, row: Inventory) => formatCurrency(row.quantity * row.price),
      width: '150px',
    },
    {
      key: 'note',
      label: 'Note',
      render: (value: string) => <span className="block max-w-[260px] truncate">{value || '-'}</span>,
      width: '260px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.INVENTORY_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Inventory Management"
          description="Manage school inventory, monitor stock levels, track item value, and keep supply records organized from one control desk."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchInventory()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Inventory Items"
            value={stats.totalItems}
            description="Distinct stock records"
            icon={<Boxes className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Total Stock"
            value={stats.totalQuantity}
            description="Combined quantity across all items"
            icon={<PackageCheck className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Stock Value"
            value={formatCurrency(stats.totalValue)}
            description="Estimated total inventory worth"
            icon={<BadgeDollarSign className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockCount}
            description={`Items at or below ${LOW_STOCK_THRESHOLD} units`}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="rose"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Inventory Registry</CardTitle>
              <CardDescription>Search, review, edit, and maintain stock items, quantities, prices, and notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="lowStock">Low Stock</TabsTrigger>
                  <TabsTrigger value="inStock">Healthy Stock</TabsTrigger>
                  <TabsTrigger value="highValue">High Value</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, unit, note, quantity or price"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Warehouse className="h-4 w-4" />
                      {filteredInventory.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredInventory}
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
                <CardTitle>Low Stock Watchlist</CardTitle>
                <CardDescription>Items that may need restocking soon.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockItems.length === 0 ? (
                  <EmptyMiniState message="No low-stock items right now." />
                ) : (
                  lowStockItems.map(item => (
                    <MiniInventoryRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.unit || 'No unit'} · ${formatCurrency(item.price)} each`}
                      trailing={`${item.quantity} in stock`}
                      badge={<QuantityBadge count={item.quantity} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Top Value Items</CardTitle>
                <CardDescription>Inventory entries with the highest stock value.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topValueItems.length === 0 ? (
                  <EmptyMiniState message="No inventory value data available yet." />
                ) : (
                  topValueItems.map(item => (
                    <MiniInventoryRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.quantity} × ${formatCurrency(item.price)}`}
                      trailing={formatCurrency(item.quantity * item.price)}
                      badge={<Badge variant="outline">Value</Badge>}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">High-value inventory stays visible here for quick review.</span>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('highValue')}>
                  View High Value
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Unit Snapshot</CardTitle>
                <CardDescription>How stock is distributed across measurement units.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unitSummary.length === 0 ? (
                  <EmptyMiniState message="No unit summary available yet." />
                ) : (
                  unitSummary.map(([unit, count]) => (
                    <QueueRow
                      key={unit}
                      label={unit}
                      value={count}
                      helper="Combined quantity"
                      icon={<ClipboardList className="h-4 w-4" />}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <InventoryFormModal
          isEdit={Boolean(selectedItem)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />

        <InventoryViewModal
          item={isViewOpen ? selectedItem : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedItem(null)
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
  accent: 'sky' | 'emerald' | 'amber' | 'rose'
}) {
  const accentClasses = {
    sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
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

function QuantityBadge({ count }: { count: number }) {
  if (count <= LOW_STOCK_THRESHOLD) {
    return <Badge variant="destructive">{count}</Badge>
  }

  return <Badge variant="outline">{count}</Badge>
}

function MiniInventoryRow({
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

function InventoryFormModal({
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
  values: InventoryFormValues
  onClose: () => void
  onChange: (field: keyof InventoryFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}
      description="Create a stock item or update quantity, unit, unit price, and operational notes."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Item Name" value={values.name} onChange={value => onChange('name', value)} required />
          <Field label="Quantity" type="number" value={values.quantity} onChange={value => onChange('quantity', value)} required />
          <Field label="Unit" value={values.unit} onChange={value => onChange('unit', value)} />
          <Field label="Unit Price" type="number" value={values.price} onChange={value => onChange('price', value)} />
          <TextAreaField label="Note" value={values.note} onChange={value => onChange('note', value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function InventoryViewModal({
  item,
  onClose,
  onEdit,
}: {
  item: Inventory | null
  onClose: () => void
  onEdit: (item: Inventory) => void
}) {
  if (!item) return null

  const rows = [
    { label: 'Item Name', value: item.name },
    { label: 'Quantity', value: String(item.quantity) },
    { label: 'Unit', value: item.unit || '-' },
    { label: 'Unit Price', value: formatCurrency(item.price) },
    { label: 'Stock Value', value: formatCurrency(item.quantity * item.price) },
    { label: 'Note', value: item.note || '-' },
  ]

  return (
    <ModalShell title="Inventory Details" description="Review the selected stock item before making changes." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(item)}>
          Edit Item
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value)
}
