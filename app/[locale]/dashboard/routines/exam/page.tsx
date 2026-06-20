'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, Clock3, GraduationCap, MapPin, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { LoadingState } from '@/components/states/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Class, Exam } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type ExamRoutineItem = Exam & {
  startTime: string
  endTime: string
  room: string
  seatPlan: string
  invigilator: string
  status: 'upcoming' | 'today' | 'completed'
}

const defaultTimeSlots = [
  { startTime: '09:00', endTime: '11:00' },
  { startTime: '11:30', endTime: '01:30' },
  { startTime: '02:00', endTime: '04:00' },
]

export default function ExamRoutinePage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClass, setSelectedClass] = useState('all')
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'today' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<ExamRoutineItem | null>(null)
  const [overrides, setOverrides] = useState<Record<string, Partial<ExamRoutineItem>>>({})

  useEffect(() => {
    void fetchRoutineData()
  }, [])

  const fetchRoutineData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [examsRes, classesRes] = await Promise.all([
        fetch('/api/exams', { cache: 'no-store' }),
        fetch('/api/classes', { cache: 'no-store' }),
      ])

      const [examsData, classesData] = await Promise.all([examsRes.json(), classesRes.json()])

      if (!examsRes.ok || !examsData.success) {
        throw new Error(examsData.message || 'Failed to load exams')
      }
      if (!classesRes.ok || !classesData.success) {
        throw new Error(classesData.message || 'Failed to load classes')
      }

      setExams(examsData.data)
      setClasses(classesData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exam routine data')
    } finally {
      setLoading(false)
    }
  }

  const routineItems = useMemo(
    () => buildExamRoutine(exams, classes, overrides),
    [exams, classes, overrides]
  )

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return routineItems.filter(item => {
      const classMatch = selectedClass === 'all' || item.class === selectedClass
      const tabMatch = activeTab === 'all' || item.status === activeTab
      const termMatch =
        !term ||
        [item.name, item.class, item.subject, item.room, item.invigilator, item.date]
          .join(' ')
          .toLowerCase()
          .includes(term)

      return classMatch && tabMatch && termMatch
    })
  }, [activeTab, routineItems, searchTerm, selectedClass])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ExamRoutineItem[]>()

    filteredItems.forEach(item => {
      const current = map.get(item.date) ?? []
      current.push(item)
      map.set(item.date, current)
    })

    return [...map.entries()].sort((left, right) => left[0].localeCompare(right[0]))
  }, [filteredItems])

  const stats = useMemo(() => {
    const total = routineItems.length
    const upcoming = routineItems.filter(item => item.status === 'upcoming').length
    const today = routineItems.filter(item => item.status === 'today').length
    const classesCovered = new Set(routineItems.map(item => item.class)).size

    return { total, upcoming, today, classesCovered }
  }, [routineItems])

  const busiestDays = useMemo(() => {
    const counts = new Map<string, number>()

    routineItems.forEach(item => {
      counts.set(item.date, (counts.get(item.date) ?? 0) + 1)
    })

    return [...counts.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)
  }, [routineItems])

  const classLoad = useMemo(() => {
    const counts = new Map<string, number>()

    routineItems.forEach(item => {
      counts.set(item.class, (counts.get(item.class) ?? 0) + 1)
    })

    return [...counts.entries()]
      .map(([className, count]) => ({ className, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6)
  }, [routineItems])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedExam) return

    setSubmitting(true)

    try {
      setOverrides(current => ({
        ...current,
        [selectedExam.id]: {
          startTime: selectedExam.startTime,
          endTime: selectedExam.endTime,
          room: selectedExam.room,
          seatPlan: selectedExam.seatPlan,
          invigilator: selectedExam.invigilator,
        },
      }))
    } finally {
      setSubmitting(false)
      setSelectedExam(null)
    }
  }

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.EXAM_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Exam Routine"
          description="Manage exam schedule flow, room assignments, invigilation, and daily exam sequencing."
          action={
            <Button variant="outline" onClick={() => void fetchRoutineData()} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />

        {error ? <StatusBanner>{error}</StatusBanner> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Exams"
            value={stats.total}
            description="All scheduled exam entries"
            icon={<BookOpen className="h-4 w-4" />}
            tone="sky"
          />
          <MetricCard
            title="Upcoming"
            value={stats.upcoming}
            description="Waiting for exam day"
            icon={<CalendarDays className="h-4 w-4" />}
            tone="emerald"
          />
          <MetricCard
            title="Today"
            value={stats.today}
            description="Running on current date"
            icon={<Clock3 className="h-4 w-4" />}
            tone="amber"
          />
          <MetricCard
            title="Classes"
            value={stats.classesCovered}
            description="Classes in this routine"
            icon={<GraduationCap className="h-4 w-4" />}
            tone="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Exam Schedule Board</CardTitle>
              <CardDescription>Filter class-wise routines and inspect date-grouped exam flow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Class Filter</span>
                  <select
                    value={selectedClass}
                    onChange={event => setSelectedClass(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    <option value="all">All Classes</option>
                    {Array.from(new Set(classes.map(item => item.name))).map(className => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Search Routine</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder="Search exam, subject, class, room or invigilator"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              </div>

              <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  {groupedByDate.length === 0 ? (
                    <EmptyMiniState message="No exam routine matched the current filters." />
                  ) : (
                    groupedByDate.map(([date, items]) => (
                      <div key={date} className="rounded-xl border border-border">
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{formatDate(date)}</p>
                            <p className="text-xs text-muted-foreground">{items.length} exams on this day</p>
                          </div>
                          <Badge variant="outline">{date}</Badge>
                        </div>

                        <div className="divide-y divide-border">
                          {items.map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedExam(item)}
                              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-muted/30"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-foreground">
                                  {item.name} - {item.subject || 'General'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.class} - {item.startTime} to {item.endTime}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Room {item.room} - Invigilator: {item.invigilator}
                                </p>
                              </div>
                              <RoutineStatusBadge status={item.status} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Busiest Days</CardTitle>
                <CardDescription>Dates with highest exam traffic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {busiestDays.map(day => (
                  <div key={day.date} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(day.date)}</p>
                      <p className="text-xs text-muted-foreground">{day.date}</p>
                    </div>
                    <Badge variant="outline">{day.count} exams</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Class Coverage</CardTitle>
                <CardDescription>Exam count distributed by class.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classLoad.map(item => (
                  <div key={item.className} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.className}</span>
                      <span className="text-muted-foreground">{item.count} exams</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, item.count * 15)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Routine Notes</CardTitle>
                <CardDescription>Operational checkpoints for exam day.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <NoteRow icon={<MapPin className="h-4 w-4" />} label="Seat plans" value="Assigned per exam slot" />
                <NoteRow icon={<Clock3 className="h-4 w-4" />} label="Gap policy" value="30 minutes between sessions" />
                <NoteRow icon={<GraduationCap className="h-4 w-4" />} label="Coverage" value={`${stats.classesCovered} classes included`} />
              </CardContent>
            </Card>
          </div>
        </div>

        <ExamRoutineModal
          exam={selectedExam}
          submitting={submitting}
          onClose={() => setSelectedExam(null)}
          onChange={(field, value) =>
            setSelectedExam(current => (current ? { ...current, [field]: value } : current))
          }
          onSubmit={handleSave}
        />
      </div>
    </PermissionGuard>
  )
}

function buildExamRoutine(
  exams: Exam[],
  classes: Class[],
  overrides: Record<string, Partial<ExamRoutineItem>>
) {
  const today = new Date()
  const todayKey = toDateKey(today)

  return [...exams]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((exam, index) => {
      const slot = defaultTimeSlots[index % defaultTimeSlots.length]
      const classMeta = classes.find(item => item.name === exam.class)
      const dateKey = exam.date
      const status: ExamRoutineItem['status'] =
        dateKey === todayKey ? 'today' : dateKey > todayKey ? 'upcoming' : 'completed'

      const baseItem: ExamRoutineItem = {
        ...exam,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: classMeta?.room || `Hall ${((index % 4) + 1).toString().padStart(2, '0')}`,
        seatPlan: `${exam.class} Block ${(index % 3) + 1}`,
        invigilator: classMeta?.classTeacher || `Invigilator ${(index % 5) + 1}`,
        status,
      }

      return {
        ...baseItem,
        ...overrides[exam.id],
      }
    })
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string
  value: number
  description: string
  icon: ReactNode
  tone: 'sky' | 'emerald' | 'amber' | 'violet'
}) {
  const toneClasses = {
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
        <div className={cn('rounded-full p-3 ring-1', toneClasses[tone])}>{icon}</div>
      </CardContent>
    </Card>
  )
}

function RoutineStatusBadge({ status }: { status: ExamRoutineItem['status'] }) {
  const config = {
    upcoming: { label: 'Upcoming', variant: 'outline' as const },
    today: { label: 'Today', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'secondary' as const },
  }

  return <Badge variant={config[status].variant}>{config[status].label}</Badge>
}

function NoteRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
      <div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function ExamRoutineModal({
  exam,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: {
  exam: ExamRoutineItem | null
  submitting: boolean
  onClose: () => void
  onChange: (field: keyof ExamRoutineItem, value: string | number) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  if (!exam) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{exam.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {exam.class} - {exam.subject || 'General'} - {formatDate(exam.date)}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            x
          </Button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Start Time" value={exam.startTime} onChange={value => onChange('startTime', value)} />
            <Field label="End Time" value={exam.endTime} onChange={value => onChange('endTime', value)} />
            <Field label="Room" value={exam.room} onChange={value => onChange('room', value)} />
            <Field label="Seat Plan" value={exam.seatPlan} onChange={value => onChange('seatPlan', value)} />
            <Field
              label="Invigilator"
              value={exam.invigilator}
              onChange={value => onChange('invigilator', value)}
            />
            <Field
              label="Total Marks"
              value={String(exam.totalMarks)}
              onChange={value => onChange('totalMarks', Number(value) || 0)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Routine Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  )
}

function EmptyMiniState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}

function StatusBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  )
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
