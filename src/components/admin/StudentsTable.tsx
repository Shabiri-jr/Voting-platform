import { CheckCircleIcon, MinusCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { StudentForm } from "@/components/StudentForm";
import type { AdminFormAction } from "@/components/admin/useAdminAction";

export type StudentRow = {
  id: string;
  matricNumber: string;
  firstName: string;
  surname: string;
  department: string;
  level: string;
  isEligible: boolean;
  hasVoted: boolean;
  votedAt: string | null;
};

type StudentsTableProps = {
  students: StudentRow[];
  saveAction?: AdminFormAction;
  deleteAction?: (formData: FormData) => Promise<void>;
  canDelete?: boolean;
};

export function StudentsTable({
  students,
  saveAction,
  deleteAction,
  canDelete = false,
}: StudentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <caption className="sr-only">Registered student voters</caption>
        <thead>
          <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-5 py-4 font-semibold">Student</th>
            <th scope="col" className="px-5 py-4 font-semibold">Matric number</th>
            <th scope="col" className="px-5 py-4 font-semibold">Department</th>
            <th scope="col" className="px-5 py-4 font-semibold">Level</th>
            <th scope="col" className="px-5 py-4 font-semibold">Eligibility</th>
            <th scope="col" className="px-5 py-4 font-semibold">Voting status</th>
            {saveAction ? <th scope="col" className="px-5 py-4 font-semibold">Manage</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-slate-50/70">
              <th scope="row" className="px-5 py-4">
                <span className="block font-semibold text-navy">
                  {student.firstName} {student.surname}
                </span>
              </th>
              <td className="metric-number px-5 py-4 text-xs text-slate-600">
                {student.matricNumber}
              </td>
              <td className="px-5 py-4 text-slate-600">{student.department}</td>
              <td className="metric-number px-5 py-4 text-slate-600">{student.level}</td>
              <td className="px-5 py-4">
                <StatusLabel
                  active={student.isEligible}
                  activeLabel="Eligible"
                  inactiveLabel="Not eligible"
                />
              </td>
              <td className="px-5 py-4">
                <StatusLabel
                  active={student.hasVoted}
                  activeLabel="Voted"
                  inactiveLabel="Not voted"
                />
              </td>
              {saveAction ? (
                <td className="px-5 py-4 align-top">
                  <details className="w-80 max-w-[80vw]">
                    <summary className="cursor-pointer text-sm font-semibold text-accent">
                      Edit
                    </summary>
                    <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                      <StudentForm
                        action={saveAction}
                        submitLabel="Update student"
                        initialValue={{
                          id: student.id,
                          matricNumber: student.matricNumber,
                          firstName: student.firstName,
                          surname: student.surname,
                          department: student.department,
                          level: student.level,
                          isEligible: student.isEligible,
                        }}
                      />
                      {canDelete && deleteAction ? (
                        <form action={deleteAction} className="mt-4 border-t pt-4">
                          <input type="hidden" name="id" value={student.id} />
                          <button
                            type="submit"
                            className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 hover:bg-red-100"
                          >
                            Delete student
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusLabel({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const Icon = active ? CheckCircleIcon : MinusCircleIcon;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        active ? "bg-brand-50 text-brand-800" : "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      <Icon className="size-3.5" weight="fill" aria-hidden />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
