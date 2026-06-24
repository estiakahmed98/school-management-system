"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CrudPageLayout } from "@/components/crud/crud-page-layout";
import { ColumnConfig } from "@/components/data-table/data-table";
import { LoadingState } from "@/components/states/loading-state";
import { PermissionGuard } from "@/components/common/permission-guard";
import { PERMISSIONS } from "@/lib/auth/constants";
import type { Class, Parent, Section, Student } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentFormValues = {
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  parentId: string;
  phone: string;
  email: string;
  admissionDate: string;
};

const emptyForm: StudentFormValues = {
  name: "",
  rollNumber: "",
  class: "",
  section: "",
  parentId: "",
  phone: "",
  email: "",
  admissionDate: "",
};

type SelectOption = {
  value: string;
  label: string;
};

type DeleteStep = "warning" | "confirm";

export default function StudentsPage() {
  const t = useTranslations();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("warning");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [formValues, setFormValues] = useState<StudentFormValues>(emptyForm);

  useEffect(() => {
    void fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsRes, classesRes, sectionsRes, parentsRes] =
        await Promise.all([
          fetch("/api/students", { cache: "no-store" }),
          fetch("/api/classes", { cache: "no-store" }),
          fetch("/api/sections", { cache: "no-store" }),
          fetch("/api/parents", { cache: "no-store" }),
        ]);

      const [studentsData, classesData, sectionsData, parentsData] =
        await Promise.all([
          studentsRes.json(),
          classesRes.json(),
          sectionsRes.json(),
          parentsRes.json(),
        ]);

      if (!studentsRes.ok || !studentsData.success) {
        throw new Error(studentsData.message || t("common.error"));
      }
      if (!classesRes.ok || !classesData.success) {
        throw new Error(classesData.message || t("common.error"));
      }
      if (!sectionsRes.ok || !sectionsData.success) {
        throw new Error(sectionsData.message || t("common.error"));
      }
      if (!parentsRes.ok || !parentsData.success) {
        throw new Error(parentsData.message || t("common.error"));
      }

      setStudents(studentsData.data);
      setClasses(classesData.data);
      setSections(sectionsData.data);
      setParents(parentsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
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
    setSelectedStudent(null);
    setFormValues(emptyForm);
    setIsFormOpen(true);
  };

  const openEditModal = (student: Student) => {
    resetMessages();
    setSelectedStudent(student);
    setFormValues({
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      section: student.section,
      parentId: student.parentId,
      phone: student.phone,
      email: student.email,
      admissionDate: student.admissionDate,
    });
    setIsFormOpen(true);
  };

  const openViewModal = (student: Student) => {
    setSelectedStudent(student);
    setIsViewOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    resetMessages();
    setSelectedStudent(student);
    setDeleteStep("warning");
    setDeleteConfirmation("");
    setIsDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (isSubmitting) return;
    setIsFormOpen(false);
    setSelectedStudent(null);
    setFormValues(emptyForm);
  };

  const closeDeleteModal = () => {
    if (isSubmitting) return;
    setIsDeleteOpen(false);
    setDeleteStep("warning");
    setDeleteConfirmation("");
    setSelectedStudent(null);
  };

  const handleFormChange = (field: keyof StudentFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const method = selectedStudent ? "PUT" : "POST";
      const endpoint = selectedStudent
        ? `/api/students/${selectedStudent.id}`
        : "/api/students";
      const payload = {
        ...formValues,
        class: formValues.class.trim(),
        section: formValues.section.trim(),
        name: formValues.name.trim(),
        parentId: formValues.parentId.trim(),
        phone: formValues.phone.trim(),
        email: formValues.email.trim(),
        rollNumber: formValues.rollNumber.trim(),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t("common.error"));
      }

      setSuccessMessage(data.message || t("common.saveSuccess"));
      setIsFormOpen(false);
      setSelectedStudent(null);
      setFormValues(emptyForm);
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    resetMessages();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || t("common.error"));
      }

      setSuccessMessage(data.message || t("common.deleteSuccess"));
      setIsSubmitting(false);
      closeDeleteModal();
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setIsSubmitting(false);
    }
  };

  const columns: ColumnConfig[] = [
    { key: "name", label: t("students.name") },
    { key: "rollNumber", label: t("students.rollNumber") },
    { key: "class", label: t("students.class") },
    { key: "section", label: t("students.section") },
    { key: "parentName", label: t("students.parentName") },
    { key: "email", label: t("students.email") },
  ];

  const classOptions = useMemo(
    () =>
      Array.from(
        new Set(classes.map((item) => item.name).filter(Boolean)),
      ).sort(),
    [classes],
  );

  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sections
            .filter(
              (item) => !formValues.class || item.class === formValues.class,
            )
            .map((item) => item.name)
            .filter(Boolean),
        ),
      ).sort(),
    [formValues.class, sections],
  );

  const parentOptions = useMemo(
    () =>
      parents
        .map((item) => ({
          value: item.id,
          label: `${item.name} · ${item.phone || item.email || "No contact"} · ${item.children} child${item.children === 1 ? "" : "ren"}`,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [parents],
  );

  if (loading) return <LoadingState />;

  return (
    <PermissionGuard permission={PERMISSIONS.STUDENT_VIEW}>
      <div className="space-y-4">
        {error ? <StatusBanner tone="error">{error}</StatusBanner> : null}
        {successMessage ? (
          <StatusBanner tone="success">{successMessage}</StatusBanner>
        ) : null}

        <CrudPageLayout
          title={t("students.title")}
          columns={columns}
          data={students}
          onView={openViewModal}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          addButtonLabel={t("students.addStudent")}
        />

        <StudentFormModal
          isOpen={isFormOpen}
          isSubmitting={isSubmitting}
          isEdit={Boolean(selectedStudent)}
          values={formValues}
          classOptions={classOptions}
          sectionOptions={sectionOptions}
          parentOptions={parentOptions}
          title={
            selectedStudent
              ? t("students.editStudent")
              : t("students.addStudent")
          }
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
          t={t}
        />

        <StudentViewModal
          student={isViewOpen ? selectedStudent : null}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedStudent(null);
          }}
          onEdit={(student) => {
            setIsViewOpen(false);
            openEditModal(student);
          }}
          t={t}
        />

        <DeleteStudentModal
          isOpen={isDeleteOpen}
          student={selectedStudent}
          step={deleteStep}
          confirmationValue={deleteConfirmation}
          isSubmitting={isSubmitting}
          onClose={closeDeleteModal}
          onContinue={() => setDeleteStep("confirm")}
          onBack={() => {
            setDeleteStep("warning");
            setDeleteConfirmation("");
          }}
          onConfirmationChange={setDeleteConfirmation}
          onDelete={handleDelete}
          t={t}
        />
      </div>
    </PermissionGuard>
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

function StudentFormModal({
  isOpen,
  isSubmitting,
  isEdit,
  values,
  classOptions,
  sectionOptions,
  parentOptions,
  title,
  onClose,
  onSubmit,
  onChange,
  t,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  isEdit: boolean;
  values: StudentFormValues;
  classOptions: string[];
  sectionOptions: string[];
  parentOptions: SelectOption[];
  title: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof StudentFormValues, value: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!isOpen) return null;

  return (
    <ModalShell
      title={title}
      description="Create or update student records from one place."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={t("students.name")}
            value={values.name}
            onChange={(value) => onChange("name", value)}
            required
          />
          <Field
            label={t("students.rollNumber")}
            value={values.rollNumber}
            onChange={(value) => onChange("rollNumber", value)}
            required
          />
          <SelectField
            label={t("students.class")}
            value={values.class}
            onChange={(value) => {
              onChange("class", value);
              onChange("section", "");
            }}
            options={classOptions}
            required
          />
          <SelectField
            label={t("students.section")}
            value={values.section}
            onChange={(value) => onChange("section", value)}
            options={sectionOptions}
            required
          />
          <SelectField
            label={t("students.parentName")}
            value={values.parentId}
            onChange={(value) => onChange("parentId", value)}
            options={parentOptions}
            required
          />
          <Field
            label={t("students.phone")}
            value={values.phone}
            onChange={(value) => onChange("phone", value)}
            type="tel"
            required
          />
          <Field
            label={t("students.email")}
            value={values.email}
            onChange={(value) => onChange("email", value)}
            type="email"
            required
          />
          <Field
            label="Admission Date"
            value={values.admissionDate}
            onChange={(value) => onChange("admissionDate", value)}
            type="date"
            required={!isEdit}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEdit
                ? t("common.save")
                : "Create Student"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function StudentViewModal({
  student,
  onClose,
  onEdit,
  t,
}: {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!student) return null;

  const rows = [
    { label: t("students.name"), value: student.name },
    { label: t("students.rollNumber"), value: student.rollNumber },
    { label: t("students.class"), value: student.class },
    { label: t("students.section"), value: student.section || "-" },
    { label: t("students.parentName"), value: student.parentName || "-" },
    { label: t("students.phone"), value: student.phone || "-" },
    { label: t("students.email"), value: student.email || "-" },
    { label: "Admission Date", value: student.admissionDate || "-" },
    { label: "Status", value: student.status },
  ];

  return (
    <ModalShell
      title={t("students.studentDetails")}
      description="Review the selected student's information."
      onClose={onClose}
    >
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

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => onEdit(student)}
          disabled={!student}
        >
          {t("common.edit")}
        </Button>
      </div>
    </ModalShell>
  );
}

function DeleteStudentModal({
  isOpen,
  student,
  step,
  confirmationValue,
  isSubmitting,
  onClose,
  onContinue,
  onBack,
  onConfirmationChange,
  onDelete,
  t,
}: {
  isOpen: boolean;
  student: Student | null;
  step: DeleteStep;
  confirmationValue: string;
  isSubmitting: boolean;
  onClose: () => void;
  onContinue: () => void;
  onBack: () => void;
  onConfirmationChange: (value: string) => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!isOpen || !student) return null;

  const isPhraseMatched = confirmationValue.trim().toUpperCase() === "DELETE";

  return (
    <ModalShell
      title="Delete Student"
      description="This action is intentionally protected with two steps."
      onClose={onClose}
    >
      {step === "warning" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {`You are about to permanently delete ${student.name}.`}
          </div>
          <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
            All student-linked records that use cascade delete may also be
            removed. Review carefully before continuing.
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To complete deletion, type DELETE in the field below.
          </p>
          <Field
            label="Type DELETE to confirm"
            value={confirmationValue}
            onChange={onConfirmationChange}
            placeholder="DELETE"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={!isPhraseMatched || isSubmitting}
            >
              {isSubmitting ? "Deleting..." : t("common.delete")}
            </Button>
          </div>
        </div>
      )}
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
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | SelectOption[];
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option
            key={typeof option === "string" ? option : option.value}
            value={typeof option === "string" ? option : option.value}
          >
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
