import { CandidateForm } from "@/components/CandidateForm";
import type { AdminFormAction } from "@/components/admin/useAdminAction";
import { CandidateAvatar } from "@/components/shared/CandidateAvatar";

export type CandidateRow = {
  id: string;
  positionId: string;
  positionTitle: string;
  fullName: string;
  department: string;
  level: string;
  photoUrl?: string | null;
  manifesto?: string | null;
};

export function CandidateList({
  candidates,
  positions,
  saveAction,
  deleteAction,
}: {
  candidates: CandidateRow[];
  positions: Array<{ id: string; title: string }>;
  saveAction?: AdminFormAction;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  const groups = candidates.reduce<Map<string, CandidateRow[]>>(
    (currentGroups, candidate) => {
      const group = currentGroups.get(candidate.positionTitle) ?? [];
      group.push(candidate);
      currentGroups.set(candidate.positionTitle, group);
      return currentGroups;
    },
    new Map(),
  );

  return (
    <div className="space-y-7">
      {[...groups.entries()].map(([position, items]) => (
        <section key={position}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-navy">{position}</h2>
            <p className="metric-number text-xs text-slate-500">
              {items.length} candidates
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((candidate) => (
              <article key={candidate.id} className="rounded-2xl border bg-white p-5">
                <div className="flex items-start gap-4">
                  <CandidateAvatar
                    name={candidate.fullName}
                    photoUrl={candidate.photoUrl}
                  />
                  <div>
                    <h3 className="font-semibold text-navy">{candidate.fullName}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {candidate.department} · {candidate.level}
                    </p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {candidate.manifesto || "No manifesto added."}
                </p>
                {saveAction ? (
                  <details className="mt-4 border-t pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-accent">
                      Edit candidate
                    </summary>
                    <div className="mt-4">
                      <CandidateForm
                        action={saveAction}
                        positions={positions}
                        submitLabel="Update candidate"
                        initialValue={{
                          id: candidate.id,
                          positionId: candidate.positionId,
                          fullName: candidate.fullName,
                          department: candidate.department,
                          level: candidate.level,
                          manifesto: candidate.manifesto,
                          photoUrl: candidate.photoUrl,
                        }}
                      />
                      {deleteAction ? (
                        <form action={deleteAction} className="mt-4">
                          <input type="hidden" name="id" value={candidate.id} />
                          <button
                            type="submit"
                            className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800"
                          >
                            Delete candidate
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
