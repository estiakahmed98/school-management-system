'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { BookOpen, Clock3, Filter, RefreshCw, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { PermissionGuard } from '@/components/common/permission-guard'
import { LoadingState } from '@/components/states/loading-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PERMISSIONS } from '@/lib/auth/constants'
import type { Class, Subject, Teacher } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type RoutineSlot = {
  id: string
  day: DayKey
  period: string
  start: string
  end: string
  classId: string
  classLabel: string
  section: string
  subject: string
  teacher: string
  room: string
  status: 'scheduled' | 'lab' | 'break' | 'substitute'
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'

const days: Array<{ key: DayKey; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
]

const periodBlueprint = [
  { period: 'P1', start: '08:00', end: '08:45' },
  { period: 'P2', start: '08:50', end: '09:35' },
  { period: 'P3', start: '09:40', end: '10:25' },
  { period: 'P4', start: '10:45', end: '11:30' },
  { period: 'P5', start: '11:35', end: '12:20' },
  { period: 'P6', start: '12:25', end: '01:10' },
]

export default function ClassRoutinePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday')
  const [selectedSlot, setSelectedSlot] = useState<RoutineSlot | null>(null)
  const [slotOverrides, setSlotOverrides] = useState<Record<string, Partial<RoutineSlot>>>({})

  useEffect(() => {
    void fetchRoutineData()
  }, [])

  const fetchRoutineData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        fetch('/api/classes', { cache: 'no-store' }),
        fetch('/api/subjects', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
      ])

      const [classesData, subjectsData, teachersData] = await Promise.all([
        classesRes.json(),
        subjectsRes.json(),
        teachersRes.json(),
      ])

      if (!classesRes.ok || !classesData.success) {
        throw new Error(classesData.message || 'Failed to load classes')
      }
      if (!subjectsRes.ok || !subjectsData.success) {
        throw new Error(subjectsData.message || 'Failed to load subjects')
      }
      if (!teachersRes.ok || !teachersData.success) {
        throw new Error(teachersData.message || 'Failed to load teachers')
      }

      setClasses(classesData.data)
      setSubjects(subjectsData.data)
      setTeachers(teachersData.data)
      setSelectedClassId(current => current || classesData.data[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class routine data')
    } finally {
      setLoading(false)
    }
  }

  const routineSlots = useMemo(
    () => buildRoutineSlots(classes, subjects, teachers, slotOverrides),
    [classes, subjects, teachers, slotOverrides]
  )

  const classOptions = useMemo(
    () =>
      classes.map(item => ({
        id: item.id,
        label: `${item.name} - Section ${item.section}`,
      })),
    [classes]
  )

  const selectedClass = useMemo(
    () => classes.find(item => item.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  )

  const selectedClassSlots = useMemo(
    () => routineSlots.filter(slot => slot.classId === selectedClassId),
    [routineSlots, selectedClassId]
  )

  const selectedDaySlots = useMemo(
    () => selectedClassSlots.filter(slot => slot.day === selectedDay),
    [selectedClassSlots, selectedDay]
  )

  const stats = useMemo(() => {
    const scheduled = selectedClassSlots.filter(slot => slot.status !== 'break').length
    const labs = selectedClassSlots.filter(slot => slot.status === 'lab').length
    const substitute = selectedClassSlots.filter(slot => slot.status === 'substitute').length
    const teacherCount = new Set(
      selectedClassSlots.filter(slot => slot.status !== 'break').map(slot => slot.teacher)
    ).size

    return { scheduled, labs, substitute, teacherCount }
  }, [selectedClassSlots])

  const teacherLoad = useMemo(() => {
    const map = new Map<string, number>()

    selectedClassSlots
      .filter(slot => slot.status !== 'break')
      .forEach(slot => {
        map.set(slot.teacher, (map.get(slot.teacher) ?? 0) + 1)
      })

    return [...map.entries()]
      .map(([teacher, periods]) => ({ teacher, periods }))
      .sort((left, right) => right.periods - left.periods)
      .slice(0, 5)
  }, [selectedClassSlots])

  const subjectMix = useMemo(() => {
    const map = new Map<string, number>()

    selectedClassSlots
      .filter(slot => slot.status !== 'break')
      .forEach(slot => {
        map.set(slot.subject, (map.get(slot.subject) ?? 0) + 1)
      })

    return [...map.entries()]
      .map(([subject, count]) => ({ subject, count }))
      .sort((left, right) => right.count - left.count)
  }, [selectedClassSlots])

  const updateSlot = (slotId: string, nextValues: Partial<RoutineSlot>) => {
    setSlotOverrides(current => ({
      ...current,
      [slotId]: {
        ...current[slotId],
        ...nextValues,
      },
    }))
  }

  if (loading) return <LoadingState />

  return (
    <PermissionGuard permission={PERMISSIONS.CLASS_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Class Routine"
          description="View weekly class schedules, teacher load, room usage, and period-level routine details."
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
            title="Weekly Periods"
            value={stats.scheduled}
            description="Scheduled learning periods"
            icon={<Clock3 className="h-4 w-4" />}
            tone="sky"
          />
          <MetricCard
            title="Lab Sessions"
            value={stats.labs}
            description="Marked as practical periods"
            icon={<BookOpen className="h-4 w-4" />}
            tone="emerald"
          />
          <MetricCard
            title="Teachers"
            value={stats.teacherCount}
            description="Faculty members on this routine"
            icon={<UserRound className="h-4 w-4" />}
            tone="amber"
          />
          <MetricCard
            title="Substitutes"
            value={stats.substitute}
            description="Temporary adjusted periods"
            icon={<Filter className="h-4 w-4" />}
            tone="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Weekly Routine Planner</CardTitle>
              <CardDescription>Select a class and inspect its day-wise routine grid.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(240px,320px)_1fr]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Class and Section</span>
                  <select
                    value={selectedClassId}
                    onChange={event => setSelectedClassId(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
                  >
                    {classOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-3">
                  <InfoPill label="Class Teacher" value={selectedClass?.classTeacher || 'Not assigned'} />
                  <InfoPill label="Room" value={selectedClass?.room || 'TBD'} />
                  <InfoPill label="Capacity" value={String(selectedClass?.capacity || 0)} />
                </div>
              </div>

              <Tabs value={selectedDay} onValueChange={value => setSelectedDay(value as DayKey)}>
                <TabsList variant="line">
                  {days.map(day => (
                    <TabsTrigger key={day.key} value={day.key}>
                      {day.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {days.map(day => (
                  <TabsContent key={day.key} value={day.key} className="pt-3">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] border-separate border-spacing-0 overflow-hidden rounded-xl border border-border">
                        <thead>
                          <tr className="bg-muted/60">
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Period
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Time
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Subject
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Teacher
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Room
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Status
                            </th>
                            <th className="border-b border-border px-4 py-3 text-left text-sm font-semibold text-foreground">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClassSlots
                            .filter(slot => slot.day === day.key)
                            .map(slot => (
                              <tr key={slot.id} className="bg-card transition-colors hover:bg-muted/30">
                                <td className="border-b border-border px-4 py-3 text-sm font-medium text-foreground">
                                  {slot.period}
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
                                  {slot.start} - {slot.end}
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm text-foreground">
                                  {slot.subject}
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm text-foreground">
                                  {slot.teacher}
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm text-foreground">
                                  {slot.room}
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm">
                                  <RoutineStatusBadge status={slot.status} />
                                </td>
                                <td className="border-b border-border px-4 py-3 text-sm">
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(slot)}>
                                    Inspect
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Today Snapshot</CardTitle>
                <CardDescription>
                  {days.find(day => day.key === selectedDay)?.label} schedule for {selectedClass?.name || 'selected class'}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDaySlots.map(slot => (
                  <div key={slot.id} className="rounded-lg border border-border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{slot.period} - {slot.subject}</p>
                        <p className="text-xs text-muted-foreground">{slot.start} - {slot.end} - {slot.teacher}</p>
                      </div>
                      <RoutineStatusBadge status={slot.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Teacher Load</CardTitle>
                <CardDescription>Most engaged teachers for this class routine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacherLoad.length === 0 ? (
                  <EmptyMiniState message="No teaching periods found." />
                ) : (
                  teacherLoad.map(item => (
                    <div
                      key={item.teacher}
                      className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                    >
                      <span className="text-sm font-medium text-foreground">{item.teacher}</span>
                      <Badge variant="outline">{item.periods} periods</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Subject Mix</CardTitle>
                <CardDescription>Balance of subjects across the whole week.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subjectMix.slice(0, 6).map(item => (
                  <div key={item.subject} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.subject}</span>
                      <span className="text-muted-foreground">{item.count} periods</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, item.count * 12)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <RoutineSlotModal
          slot={selectedSlot}
          teachers={teachers}
          onClose={() => setSelectedSlot(null)}
          onSave={nextSlot => {
            updateSlot(nextSlot.id, nextSlot)
            setSelectedSlot(null)
          }}
        />
      </div>
    </PermissionGuard>
  )
}

function buildRoutineSlots(
  classes: Class[],
  subjects: Subject[],
  teachers: Teacher[],
  overrides: Record<string, Partial<RoutineSlot>>
) {
  const fallbackTeachers = teachers.map(teacher => teacher.name)

  return classes.flatMap((item, classIndex) => {
    const classSubjects = subjects.filter(subject => subject.class === item.name)
    const subjectPool = classSubjects.length > 0 ? classSubjects : subjects

    return days.flatMap((day, dayIndex) =>
      periodBlueprint.map((period, periodIndex) => {
        const id = `${item.id}-${day.key}-${period.period}`
        const isBreak = periodIndex === 2
        const subjectRecord = subjectPool[(periodIndex + dayIndex) % Math.max(subjectPool.length, 1)]
        const teacherName =
          subjectRecord?.teacher ||
          item.classTeacher ||
          fallbackTeachers[(classIndex + dayIndex + periodIndex) % Math.max(fallbackTeachers.length, 1)] ||
          'Teacher TBD'

        const baseSlot: RoutineSlot = {
          id,
          day: day.key,
          period: period.period,
          start: period.start,
          end: period.end,
          classId: item.id,
          classLabel: item.name,
          section: item.section,
          subject: isBreak ? 'Break / Prayer' : subjectRecord?.name || 'General Studies',
          teacher: isBreak ? 'N/A' : teacherName,
          room: item.room || `Room ${item.name}`,
          status: isBreak ? 'break' : periodIndex === 4 ? 'lab' : 'scheduled',
        }

        return {
          ...baseSlot,
          ...overrides[id],
        }
      })
    )
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function RoutineStatusBadge({ status }: { status: RoutineSlot['status'] }) {
  const config = {
    scheduled: { label: 'Scheduled', variant: 'outline' as const },
    lab: { label: 'Lab', variant: 'default' as const },
    break: { label: 'Break', variant: 'secondary' as const },
    substitute: { label: 'Substitute', variant: 'destructive' as const },
  }

  return <Badge variant={config[status].variant}>{config[status].label}</Badge>
}

function RoutineSlotModal({
  slot,
  teachers,
  onClose,
  onSave,
}: {
  slot: RoutineSlot | null
  teachers: Teacher[]
  onClose: () => void
  onSave: (slot: RoutineSlot) => void
}) {
  const [draft, setDraft] = useState<RoutineSlot | null>(slot)

  useEffect(() => {
    setDraft(slot)
  }, [slot])

  if (!slot || !draft) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{slot.subject}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {slot.classLabel} Section {slot.section} - {slot.period} - {slot.start} - {slot.end}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            x
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Subject"
            value={draft.subject}
            onChange={value => setDraft(current => (current ? { ...current, subject: value } : current))}
          />
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Teacher</span>
            <select
              value={draft.teacher}
              onChange={event =>
                setDraft(current => (current ? { ...current, teacher: event.target.value } : current))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="N/A">N/A</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.name}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Room"
            value={draft.room}
            onChange={value => setDraft(current => (current ? { ...current, room: value } : current))}
          />
          <label className="space-y-2">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              value={draft.status}
              onChange={event =>
                setDraft(current =>
                  current ? { ...current, status: event.target.value as RoutineSlot['status'] } : current
                )
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="scheduled">Scheduled</option>
              <option value="lab">Lab</option>
              <option value="break">Break</option>
              <option value="substitute">Substitute</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => onSave(draft)}>
            Save Slot
          </Button>
        </div>
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
