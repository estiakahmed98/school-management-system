'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  Clock3,
  MessageCircleMore,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { DataTable, type ColumnConfig } from '@/components/data-table/data-table'
import { LoadingState } from '@/components/states/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { SmsLog } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type SmsAudience = 'student' | 'parent' | 'general' | 'announcement'
type SmsStatus = 'queued' | 'sent' | 'failed'

type SmsFormValues = {
  receiver: string
  type: SmsAudience
  status: SmsStatus
  message: string
}

const emptyForm: SmsFormValues = {
  receiver: '',
  type: 'student',
  status: 'queued',
  message: '',
}

const smsTemplates = [
  'Reminder: Please submit the pending tuition fee before Friday.',
  'Attendance alert: your child was marked absent today.',
  'Exam notice: the next assessment will start at 10:00 AM tomorrow.',
]

export default function SMSPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<SmsLog | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [formValues, setFormValues] = useState<SmsFormValues>(emptyForm)

  useEffect(() => {
    void fetchMessages()
  }, [])

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return messages.filter(message => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'queued' && message.status === 'queued') ||
        (activeTab === 'sent' && message.status === 'sent') ||
        (activeTab === 'failed' && message.status === 'failed') ||
        (activeTab === 'student' && message.type === 'student') ||
        (activeTab === 'parent' && message.type === 'parent')

      if (!matchesTab) return false
      if (!term) return true

      return [message.receiver, message.message, message.type, message.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [activeTab, messages, searchTerm])

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sentToday = messages.filter(message => {
      const createdAt = new Date(message.createdAt)
      createdAt.setHours(0, 0, 0, 0)
      return message.status === 'sent' && createdAt.getTime() === today.getTime()
    }).length

    return {
      total: messages.length,
      queued: messages.filter(message => message.status === 'queued').length,
      sent: messages.filter(message => message.status === 'sent').length,
      failed: messages.filter(message => message.status === 'failed').length,
      sentToday,
    }
  }, [messages])

  const queuePreview = useMemo(
    () =>
      [...messages]
        .filter(message => message.status !== 'sent')
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 5),
    [messages]
  )

  const audienceBreakdown = useMemo(
    () => ({
      student: messages.filter(message => message.type === 'student').length,
      parent: messages.filter(message => message.type === 'parent').length,
      general: messages.filter(message => message.type === 'general').length,
      announcement: messages.filter(message => message.type === 'announcement').length,
    }),
    [messages]
  )

  const fetchMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sms', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load SMS records')
      }

      setMessages(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SMS records')
    } finally {
      setLoading(false)
    }
  }

  const resetMessages = () => {
    setError(null)
    setSuccessMessage(null)
  }

  const openComposeModal = (overrides?: Partial<SmsFormValues>) => {
    resetMessages()
    setSelectedMessage(null)
    setFormValues({ ...emptyForm, ...overrides })
    setIsFormOpen(true)
  }

  const openEditModal = (message: SmsLog) => {
    resetMessages()
    setSelectedMessage(message)
    setFormValues({
      receiver: message.receiver,
      type: normalizeAudience(message.type),
      status: normalizeStatus(message.status),
      message: message.message,
    })
    setIsFormOpen(true)
  }

  const openViewModal = (message: SmsLog) => {
    setSelectedMessage(message)
    setIsViewOpen(true)
  }

  const closeFormModal = () => {
    if (submitting) return
    setIsFormOpen(false)
    setSelectedMessage(null)
    setFormValues(emptyForm)
  }

  const handleFormChange = (field: keyof SmsFormValues, value: string) => {
    setFormValues(current => ({ ...current, [field]: value }))
  }

  const handleTemplate = (template: string) => {
    setFormValues(current => ({
      ...current,
      message: current.message ? `${current.message}\n${template}` : template,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSubmitting(true)

    try {
      const isEdit = Boolean(selectedMessage)
      const endpoint = isEdit ? `/api/sms/${selectedMessage?.id}` : '/api/sms'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        receiver: formValues.receiver.trim(),
        type: formValues.type,
        status: formValues.status,
        message: formValues.message.trim(),
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save SMS record')
      }

      setSuccessMessage(data.message || 'SMS saved successfully')
      setIsFormOpen(false)
      setSelectedMessage(null)
      setFormValues(emptyForm)
      await fetchMessages()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SMS record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (message: SmsLog) => {
    resetMessages()

    if (!confirm(`Delete SMS log for ${message.receiver}?`)) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(`/api/sms/${message.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete SMS record')
      }

      setSuccessMessage(data.message || 'SMS deleted successfully')
      await fetchMessages()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete SMS record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (message: SmsLog, status: SmsStatus) => {
    resetMessages()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/sms/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update SMS status')
      }

      setSuccessMessage(`SMS marked as ${status}`)
      await fetchMessages()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SMS status')
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnConfig[] = [
    {
      key: 'receiver',
      label: 'Recipient',
      render: (value: string, row: SmsLog) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{toAudienceLabel(row.type)}</p>
        </div>
      ),
      width: '220px',
    },
    {
      key: 'message',
      label: 'Message',
      render: (value: string) => <p className="line-clamp-2 max-w-[360px] text-sm text-foreground">{value}</p>,
      width: '380px',
    },
    {
      key: 'createdAt',
      label: 'Sent At',
      render: (value: string) => formatDateTime(value),
      width: '180px',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: SmsLog['status']) => <StatusBadge status={normalizeStatus(value)} />,
      width: '120px',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_value: string, row: SmsLog) => (
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
          {row.status !== 'sent' ? (
            <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleStatusUpdate(row, 'sent')}>
              Mark Sent
            </Button>
          ) : null}
          {row.status !== 'queued' ? (
            <Button variant="ghost" size="xs" disabled={submitting} onClick={() => handleStatusUpdate(row, 'queued')}>
              Queue Again
            </Button>
          ) : null}
        </div>
      ),
      width: '320px',
    },
  ]

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.SMS_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="SMS Notifications"
          description="Send SMS to students and parents, monitor delivery states, and keep a clean notification queue."
          action={
            <>
              <Button variant="outline" onClick={() => void fetchMessages()} disabled={loading || submitting}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={() => openComposeModal()}>
                <Plus className="h-4 w-4" />
                Compose SMS
              </Button>
            </>
          }
        />

        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? <StatusBanner tone="success">{successMessage}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Queued"
            value={stats.queued}
            description="Awaiting delivery"
            icon={<BellRing className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Sent"
            value={stats.sent}
            description="Delivered to recipients"
            icon={<Send className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            description="Needs recheck or resend"
            icon={<Clock3 className="h-4 w-4" />}
            accent="rose"
          />
          <StatCard
            title="Today"
            value={stats.sentToday}
            description="Messages sent today"
            icon={<MessageCircleMore className="h-4 w-4" />}
            accent="sky"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>SMS Registry</CardTitle>
              <CardDescription>Search and manage outgoing notifications for students, parents, and school-wide alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="queued">Queued</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                  <TabsTrigger value="student">Students</TabsTrigger>
                  <TabsTrigger value="parent">Parents</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by recipient, message, audience or status"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {filteredMessages.length} records in view
                    </div>
                  </div>

                  <DataTable
                    columns={columns}
                    data={filteredMessages}
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
                <CardTitle>Queue Snapshot</CardTitle>
                <CardDescription>Messages still waiting for attention or resend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {queuePreview.length === 0 ? (
                  <EmptyMiniState message="No queued or failed messages right now." />
                ) : (
                  queuePreview.map(item => (
                    <MiniMessageRow
                      key={item.id}
                      title={item.receiver}
                      subtitle={`${toAudienceLabel(item.type)} | ${formatDateTime(item.createdAt)}`}
                      trailing={item.status.toUpperCase()}
                      badge={<StatusBadge status={normalizeStatus(item.status)} />}
                    />
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">The bell in the header tracks queued and failed SMS items.</span>
                <Button variant="outline" size="sm" onClick={() => openComposeModal({ type: 'announcement' })}>
                  New Alert
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Audience Mix</CardTitle>
                <CardDescription>Quick breakdown of the current SMS registry.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueueRow
                  label="Students"
                  value={audienceBreakdown.student}
                  helper="Student-facing messages"
                  icon={<UserRound className="h-4 w-4" />}
                />
                <QueueRow
                  label="Parents"
                  value={audienceBreakdown.parent}
                  helper="Parent notifications"
                  icon={<Users className="h-4 w-4" />}
                />
                <QueueRow
                  label="Announcements"
                  value={audienceBreakdown.announcement}
                  helper="School-wide updates"
                  icon={<MessageCircleMore className="h-4 w-4" />}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <SmsFormModal
          isEdit={Boolean(selectedMessage)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          onTemplate={handleTemplate}
        />

        <SmsViewModal
          message={isViewOpen ? selectedMessage : null}
          onClose={() => {
            setIsViewOpen(false)
            setSelectedMessage(null)
          }}
          onEdit={message => {
            setIsViewOpen(false)
            openEditModal(message)
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

function StatusBadge({ status }: { status: SmsStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)

  if (status === 'sent') {
    return <Badge variant="default">{label}</Badge>
  }

  if (status === 'failed') {
    return <Badge variant="destructive">{label}</Badge>
  }

  return <Badge variant="outline">{label}</Badge>
}

function MiniMessageRow({
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

function SmsFormModal({
  isEdit,
  isOpen,
  isSubmitting,
  values,
  onClose,
  onChange,
  onSubmit,
  onTemplate,
}: {
  isEdit: boolean
  isOpen: boolean
  isSubmitting: boolean
  values: SmsFormValues
  onClose: () => void
  onChange: (field: keyof SmsFormValues, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onTemplate: (template: string) => void
}) {
  if (!isOpen) return null

  return (
    <ModalShell
      title={isEdit ? 'Edit SMS' : 'Compose SMS'}
      description="Create a notification for students or parents, then store the delivery state in the SMS log."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Recipient"
            value={values.receiver}
            onChange={value => onChange('receiver', value)}
            required
            placeholder="Student name, parent name, or phone number"
          />
          <SelectField
            label="Audience"
            value={values.type}
            onChange={value => onChange('type', value)}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'parent', label: 'Parent' },
              { value: 'general', label: 'General' },
              { value: 'announcement', label: 'Announcement' },
            ]}
            placeholder="Select audience"
            required
          />
          <SelectField
            label="Delivery Status"
            value={values.status}
            onChange={value => onChange('status', value)}
            options={[
              { value: 'queued', label: 'Queued' },
              { value: 'sent', label: 'Sent' },
              { value: 'failed', label: 'Failed' },
            ]}
            placeholder="Select status"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Message</span>
            <div className="flex flex-wrap gap-2">
              {smsTemplates.map(template => (
                <Button key={template} type="button" variant="outline" size="xs" onClick={() => onTemplate(template)}>
                  Add template
                </Button>
              ))}
            </div>
          </div>
          <textarea
            value={values.message}
            required
            onChange={event => onChange('message', event.target.value)}
            rows={6}
            placeholder="Write the SMS content here..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update SMS' : 'Send SMS'}
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function SmsViewModal({
  message,
  onClose,
  onEdit,
}: {
  message: SmsLog | null
  onClose: () => void
  onEdit: (message: SmsLog) => void
}) {
  if (!message) return null

  const rows = [
    { label: 'Recipient', value: message.receiver },
    { label: 'Audience', value: toAudienceLabel(message.type) },
    { label: 'Status', value: message.status.toUpperCase() },
    { label: 'Created At', value: formatDateTime(message.createdAt) },
    { label: 'Message', value: message.message },
  ]

  return (
    <ModalShell title="SMS Details" description="Review the selected message and status history." onClose={onClose}>
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
        <Button type="button" onClick={() => onEdit(message)}>
          Edit SMS
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
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
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

function toAudienceLabel(type: string) {
  switch (type) {
    case 'student':
      return 'Student'
    case 'parent':
      return 'Parent'
    case 'announcement':
      return 'Announcement'
    default:
      return 'General'
  }
}

function normalizeAudience(type: string): SmsAudience {
  if (type === 'parent' || type === 'general' || type === 'announcement') {
    return type
  }

  return 'student'
}

function normalizeStatus(status: string): SmsStatus {
  if (status === 'sent' || status === 'failed') {
    return status
  }

  return 'queued'
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
