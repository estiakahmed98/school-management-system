"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  Link2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/common/permission-guard";
import {
  DataTable,
  type ColumnConfig,
} from "@/components/data-table/data-table";
import { LoadingState } from "@/components/states/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/lib/auth/constants";
import type { Parent, Student } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type ParentFormValues = {
  name: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  studentIds: string[];
};

const emptyForm: ParentFormValues = {
  name: "",
  phone: "",
  email: "",
  occupation: "",
  address: "",
  studentIds: [],
};

type StudentParentAssignment = Record<
  string,
  { parentId: string; parentName: string }
>;

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formValues, setFormValues] = useState<ParentFormValues>(emptyForm);

  useEffect(() => {
    void fetchParents();
  }, []);

  const studentParentMap = useMemo<StudentParentAssignment>(() => {
    const map: StudentParentAssignment = {};

    for (const parent of parents) {
      for (const student of parent.linkedStudents) {
        map[student.id] = {
          parentId: parent.id,
          parentName: parent.name,
        };
      }
    }

    return map;
  }, [parents]);

  const filteredParents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return parents.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "withChildren" && item.children > 0) ||
        (activeTab === "singleChild" && item.children === 1) ||
        (activeTab === "multipleChildren" && item.children > 1);

      if (!matchesTab) return false;
      if (!term) return true;

      return [
        item.name,
        item.phone,
        item.email,
        item.occupation,
        item.address,
        String(item.children),
        ...item.linkedStudents.flatMap((student) => [
          student.name,
          student.rollNumber,
          student.class,
          student.section,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [activeTab, parents, searchTerm]);

  const stats = useMemo(() => {
    const totalChildrenLinked = parents.reduce(
      (sum, item) => sum + item.children,
      0,
    );
    const multipleChildren = parents.filter((item) => item.children > 1).length;
    const unassignedStudents = students.filter(
      (item) => !studentParentMap[item.id],
    ).length;

    return {
      total: parents.length,
      totalChildrenLinked,
      multipleChildren,
      unassignedStudents,
    };
  }, [parents, studentParentMap, students]);

  const highestLinkedParents = useMemo(
    () =>
      [...parents]
        .sort((left, right) => right.children - left.children)
        .slice(0, 5),
    [parents],
  );

  const unassignedStudents = useMemo(
    () => students.filter((item) => !studentParentMap[item.id]).slice(0, 6),
    [studentParentMap, students],
  );

  const occupationSummary = useMemo(() => {
    const summary = new Map<string, number>();

    for (const item of parents) {
      const occupation = item.occupation.trim() || "Unspecified";
      summary.set(occupation, (summary.get(occupation) ?? 0) + 1);
    }

    return [...summary.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
  }, [parents]);

  const fetchParents = async () => {
    setLoading(true);
    setError(null);

    try {
      const [parentsRes, studentsRes] = await Promise.all([
        fetch("/api/parents", { cache: "no-store" }),
        fetch("/api/students", { cache: "no-store" }),
      ]);
      const [parentsData, studentsData] = await Promise.all([
        parentsRes.json(),
        studentsRes.json(),
      ]);

      if (!parentsRes.ok || !parentsData.success) {
        throw new Error(parentsData.message || "Failed to load parent records");
      }

      if (!studentsRes.ok || !studentsData.success) {
        throw new Error(studentsData.message || "Failed to load students");
      }

      setParents(parentsData.data);
      setStudents(studentsData.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load parent records",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const openAddModal = () => {
    resetMessages();
    setSelectedParent(null);
    setFormValues(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = (item: Parent) => {
    resetMessages();
    setSelectedParent(item);
    setFormValues({
      name: item.name,
      phone: item.phone,
      email: item.email,
      occupation: item.occupation,
      address: item.address,
      studentIds: item.linkedStudents.map((student) => student.id),
    });
    setIsFormOpen(true);
  };

  const openViewModal = (item: Parent) => {
    setSelectedParent(item);
    setIsViewOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setIsFormOpen(false);
    setSelectedParent(null);
    setFormValues(emptyForm);
  };

  const handleFormChange = (
    field: Exclude<keyof ParentFormValues, "studentIds">,
    value: string,
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const toggleStudentSelection = (studentId: string) => {
    setFormValues((current) => ({
      ...current,
      studentIds: current.studentIds.includes(studentId)
        ? current.studentIds.filter((id) => id !== studentId)
        : [...current.studentIds, studentId],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setSubmitting(true);

    try {
      const endpoint = selectedParent
        ? `/api/parents/${selectedParent.id}`
        : "/api/parents";
      const method = selectedParent ? "PUT" : "POST";
      const payload = {
        name: formValues.name.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        occupation: formValues.occupation.trim(),
        address: formValues.address.trim(),
        studentIds: formValues.studentIds,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save parent record");
      }

      setSuccessMessage(data.message || "Parent saved successfully");
      setIsFormOpen(false);
      setSelectedParent(null);
      setFormValues(emptyForm);
      await fetchParents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save parent record",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Parent) => {
    resetMessages();

    if (!confirm(`Delete ${item.name}?`)) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/parents/${item.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete parent record");
      }

      setSuccessMessage(data.message || "Parent deleted successfully");
      await fetchParents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete parent record",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnConfig[] = [
    {
      key: "name",
      label: "Parent",
      render: (value: string, row: Parent) => (
        <div>
          <p className="font-medium text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">
            {row.occupation || "Occupation not set"}
          </p>
        </div>
      ),
      width: "220px",
    },
    {
      key: "phone",
      label: "Contact",
      render: (value: string, row: Parent) => (
        <div>
          <p className="text-sm text-foreground">{value || "-"}</p>
          <p className="text-xs text-muted-foreground">
            {row.email || "No email address"}
          </p>
        </div>
      ),
      width: "220px",
    },
    {
      key: "children",
      label: "Children",
      render: (_value: number, row: Parent) => (
        <div className="space-y-2">
          <ChildrenBadge count={row.children} />
          {row.linkedStudents.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.linkedStudents.slice(0, 2).map((student) => (
                <Badge
                  key={student.id}
                  variant="secondary"
                  className="max-w-32 truncate"
                >
                  {student.name}
                </Badge>
              ))}
              {row.linkedStudents.length > 2 ? (
                <Badge variant="outline">
                  +{row.linkedStudents.length - 2} more
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
      width: "240px",
    },
    {
      key: "address",
      label: "Address",
      render: (value: string) => (
        <span className="block max-w-65 truncate">{value || "-"}</span>
      ),
      width: "260px",
    },
  ];

  if (loading) return <LoadingState />;

  return (
    <PermissionGuard permission={PERMISSIONS.PARENT_VIEW}>
      <div className="space-y-6">
        <PageHeader
          title="Parent Management"
          description="Manage families as one parent-to-many-children relationships, keep contacts clean, and reassign students from one guardian to another when needed."
          action={
            <>
              <Button
                variant="outline"
                onClick={() => void fetchParents()}
                disabled={loading || submitting}
              >
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
        {successMessage ? (
          <StatusBanner tone="success">{successMessage}</StatusBanner>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Parents"
            value={stats.total}
            description="Guardian profiles in the registry"
            icon={<UsersRound className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            title="Linked Children"
            value={stats.totalChildrenLinked}
            description="Students currently assigned to a parent"
            icon={<GraduationCap className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            title="Multi-Child Families"
            value={stats.multipleChildren}
            description="Parents managing more than one child"
            icon={<ShieldCheck className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            title="Unassigned Students"
            value={stats.unassignedStudents}
            description="Students not linked to any parent yet"
            icon={<Link2 className="h-4 w-4" />}
            accent="violet"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
          <Card className="border border-border/80">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Family Registry</CardTitle>
              <CardDescription>
                Search parent records, inspect linked students, and manage one
                household across multiple children.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="withChildren">Linked</TabsTrigger>
                  <TabsTrigger value="singleChild">Single Child</TabsTrigger>
                  <TabsTrigger value="multipleChildren">
                    Multiple Children
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4 pt-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by parent, contact, occupation, address, student name, roll, class or section"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {filteredParents.length} families in view
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
                <CardTitle>Largest Families</CardTitle>
                <CardDescription>
                  Parents currently connected to the highest number of students.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {highestLinkedParents.length === 0 ? (
                  <EmptyMiniState message="No parent records available yet." />
                ) : (
                  highestLinkedParents.map((item) => (
                    <MiniParentRow
                      key={item.id}
                      title={item.name}
                      subtitle={`${item.phone} · ${item.occupation || "Occupation not set"}`}
                      trailing={`${item.children} child${item.children === 1 ? "" : "ren"}`}
                      badge={<ChildrenBadge count={item.children} />}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Unassigned Students</CardTitle>
                <CardDescription>
                  Students that still need a guardian link.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unassignedStudents.length === 0 ? (
                  <EmptyMiniState message="Every listed student is linked to a parent." />
                ) : (
                  unassignedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="rounded-lg border border-border px-4 py-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.rollNumber} · {student.class} ·{" "}
                        {student.section || "No section"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">
                  Link them from the parent form to complete the family record.
                </span>
                <Button variant="outline" size="sm" onClick={openAddModal}>
                  Assign Parent
                </Button>
              </CardFooter>
            </Card>

            <Card className="border border-border/80">
              <CardHeader>
                <CardTitle>Occupation Snapshot</CardTitle>
                <CardDescription>
                  Common parent occupations across registered families.
                </CardDescription>
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
            </Card>
          </div>
        </div>

        <ParentFormModal
          isEdit={Boolean(selectedParent)}
          isOpen={isFormOpen}
          isSubmitting={submitting}
          values={formValues}
          students={students}
          selectedParentId={selectedParent?.id ?? null}
          studentParentMap={studentParentMap}
          onClose={closeFormModal}
          onChange={handleFormChange}
          onToggleStudent={toggleStudentSelection}
          onSubmit={handleSubmit}
        />

        <ParentViewModal
          parent={isViewOpen ? selectedParent : null}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedParent(null);
          }}
          onEdit={(item) => {
            setIsViewOpen(false);
            openEditModal(item);
          }}
        />
      </div>
    </PermissionGuard>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  accent: "sky" | "emerald" | "amber" | "violet";
}) {
  const accentClasses = {
    sky: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    emerald:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    amber:
      "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    violet:
      "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  };

  return (
    <Card className="border border-border/80">
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={cn("rounded-full p-3 ring-1", accentClasses[accent])}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBanner({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "error" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      )}
    >
      {children}
    </div>
  );
}

function ChildrenBadge({ count }: { count: number }) {
  return (
    <Badge variant={count > 1 ? "default" : "outline"}>
      {count} child{count === 1 ? "" : "ren"}
    </Badge>
  );
}

function MiniParentRow({
  title,
  subtitle,
  trailing,
  badge,
}: {
  title: string;
  subtitle: string;
  trailing: string;
  badge: ReactNode;
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
  );
}

function QueueRow({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

function EmptyMiniState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function ParentFormModal({
  isEdit,
  isOpen,
  isSubmitting,
  values,
  students,
  selectedParentId,
  studentParentMap,
  onClose,
  onChange,
  onToggleStudent,
  onSubmit,
}: {
  isEdit: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  values: ParentFormValues;
  students: Student[];
  selectedParentId: string | null;
  studentParentMap: StudentParentAssignment;
  onClose: () => void;
  onChange: (
    field: Exclude<keyof ParentFormValues, "studentIds">,
    value: string,
  ) => void;
  onToggleStudent: (studentId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStudentSearch("");
    }
  }, [isOpen]);

  const visibleStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();

    return [...students]
      .sort((left, right) => {
        const leftSelected = values.studentIds.includes(left.id) ? 1 : 0;
        const rightSelected = values.studentIds.includes(right.id) ? 1 : 0;
        if (leftSelected !== rightSelected) {
          return rightSelected - leftSelected;
        }
        return left.name.localeCompare(right.name);
      })
      .filter((student) => {
        if (!term) return true;

        return [
          student.name,
          student.rollNumber,
          student.class,
          student.section,
          student.parentName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
  }, [studentSearch, students, values.studentIds]);

  if (!isOpen) return null;

  return (
    <ModalShell
      title={isEdit ? "Edit Parent" : "Add Parent"}
      description="Create a guardian profile, link multiple children, and reassign students from another parent when needed."
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            value={values.name}
            onChange={(value) => onChange("name", value)}
            required
          />
          <Field
            label="Phone"
            value={values.phone}
            onChange={(value) => onChange("phone", value)}
            required
          />
          <Field
            label="Email"
            type="email"
            value={values.email}
            onChange={(value) => onChange("email", value)}
            required
          />
          <Field
            label="Occupation"
            value={values.occupation}
            onChange={(value) => onChange("occupation", value)}
          />
          <TextAreaField
            label="Address"
            value={values.address}
            onChange={(value) => onChange("address", value)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-muted/20">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Linked Children
              </h3>
              <p className="text-xs text-muted-foreground">
                Select one or more students for this parent. Choosing a student
                already assigned elsewhere will reassign that student here.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {values.studentIds.length} selected
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  for (const studentId of values.studentIds) {
                    onToggleStudent(studentId);
                  }
                }}
                disabled={values.studentIds.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students by name, roll, class, section or current parent"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {visibleStudents.map((student) => {
                const assignment = studentParentMap[student.id];
                const assignedElsewhere =
                  assignment && assignment.parentId !== selectedParentId;
                const checked = values.studentIds.includes(student.id);

                return (
                  <label
                    key={student.id}
                    className={cn(
                      "flex cursor-pointer items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
                      checked
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleStudent(student.id)}
                        className="mt-1 h-4 w-4 rounded border-border"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.rollNumber} · {student.class} ·{" "}
                          {student.section || "No section"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {assignedElsewhere ? (
                        <Badge variant="destructive">
                          Reassign from {assignment.parentName}
                        </Badge>
                      ) : assignment ? (
                        <Badge variant="secondary">Already linked</Badge>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                    </div>
                  </label>
                );
              })}

              {visibleStudents.length === 0 ? (
                <EmptyMiniState message="No students match the current search." />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? "Update Parent"
                : "Create Parent"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function ParentViewModal({
  parent,
  onClose,
  onEdit,
}: {
  parent: Parent | null;
  onClose: () => void;
  onEdit: (parent: Parent) => void;
}) {
  if (!parent) return null;

  const rows = [
    { label: "Name", value: parent.name },
    { label: "Phone", value: parent.phone || "-" },
    { label: "Email", value: parent.email || "-" },
    { label: "Occupation", value: parent.occupation || "-" },
    { label: "Address", value: parent.address || "-" },
    { label: "Linked Children", value: String(parent.children) },
  ];

  return (
    <ModalShell
      title="Parent Details"
      description="Review the selected guardian profile and the children linked to this family."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Children in this family
            </h3>
            <p className="text-xs text-muted-foreground">
              All students currently linked to this parent record.
            </p>
          </div>

          <div className="space-y-3">
            {parent.linkedStudents.length === 0 ? (
              <EmptyMiniState message="No children linked to this parent yet." />
            ) : (
              parent.linkedStudents.map((student) => (
                <div
                  key={student.id}
                  className="rounded-lg border border-border bg-background px-4 py-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {student.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.rollNumber} · {student.class} ·{" "}
                    {student.section || "No section"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
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
  );
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            x
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2 md:col-span-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}
