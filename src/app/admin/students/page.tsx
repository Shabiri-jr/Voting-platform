import {
  deleteStudentAction,
  importStudentsCsvAction,
  saveStudentAction,
} from "@/actions/admin";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminShell } from "@/components/admin/AdminShell";
import { CsvUploadForm } from "@/components/admin/CsvUploadForm";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { PermissionNotice } from "@/components/admin/PermissionNotice";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { StudentsTable } from "@/components/admin/StudentsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StudentForm } from "@/components/StudentForm";
import { getElectionContext, listStudents } from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";

type StudentsPageProps = {
  searchParams: Promise<{
    q?: string;
    department?: string;
    level?: string;
    voted?: string;
    electionId?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);
  const students = await listStudents(election?.id);
  const query = params.q?.trim().toLowerCase();
  const filtered = students.filter((student) => {
    const matchesQuery =
      !query ||
      [
        student.matricNumber,
        student.firstName,
        student.surname,
        student.department,
        student.level,
      ].some((value) => value.toLowerCase().includes(query));
    return (
      matchesQuery &&
      (!params.department || student.department === params.department) &&
      (!params.level || student.level === params.level) &&
      (!params.voted || String(student.hasVoted) === params.voted)
    );
  });
  const departments = [...new Set(students.map((student) => student.department))].sort();
  const canEdit = admin.role !== "viewer";

  async function saveStudent(formData: FormData) {
    "use server";
    return saveStudentAction(formData);
  }
  async function importCsv(formData: FormData) {
    "use server";
    return importStudentsCsvAction(formData);
  }
  async function deleteStudent(formData: FormData) {
    "use server";
    await deleteStudentAction(formData);
  }

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Eligibility register"
        title="Students"
        description={`${students.length} student records. Voting status is shown for ${election?.title ?? "the selected election"}, but candidate selections are never available.`}
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election?.id}
      />
      {!canEdit ? <div className="mt-6"><PermissionNotice /></div> : null}
      {canEdit ? (
        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          <ResourcePanel
            title="Add a student"
            description="Create one eligible voter record manually."
          >
            <StudentForm action={saveStudent} />
          </ResourcePanel>
          <ResourcePanel
            title="Import student CSV"
            description="Validate and add a roster in one upload."
          >
            <CsvUploadForm action={importCsv} />
          </ResourcePanel>
        </div>
      ) : null}
      <div className="mt-7">
        <AdminFilters
          departments={departments}
          electionId={election?.id}
          showLevel
          showVoteStatus
        />
      </div>
      <div className="mt-5">
        {filtered.length ? (
          <StudentsTable
            students={filtered}
            saveAction={canEdit ? saveStudent : undefined}
            deleteAction={admin.role === "super_admin" ? deleteStudent : undefined}
            canDelete={admin.role === "super_admin"}
          />
        ) : (
          <EmptyState
            title="No students found"
            description="Adjust the search or filters, or add a student to the eligibility register."
          />
        )}
      </div>
    </AdminShell>
  );
}
