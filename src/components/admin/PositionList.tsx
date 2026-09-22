import {
  ArrowDownIcon,
  ArrowUpIcon,
  DotsSixVerticalIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PositionForm } from "@/components/PositionForm";
import type { AdminFormAction } from "@/components/admin/useAdminAction";

export type PositionRow = {
  id: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  candidateCount?: number;
};

export function PositionList({
  positions,
  electionId,
  action,
  saveAction,
  deleteAction,
}: {
  positions: PositionRow[];
  electionId: string;
  action?: (formData: FormData) => Promise<void>;
  saveAction?: AdminFormAction;
  deleteAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <ol className="overflow-hidden rounded-2xl border bg-white">
      {positions.map((position, index) => (
        <li
          key={position.id}
          className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 border-b px-4 py-5 last:border-b-0 sm:px-6"
        >
          <DotsSixVerticalIcon className="size-5 text-slate-400" aria-hidden />
          <span className="metric-number grid size-8 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
            {String(position.displayOrder).padStart(2, "0")}
          </span>
          <div>
            <p className="font-semibold text-navy">{position.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">
              {position.description || "No description added"}
            </p>
            {saveAction ? (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-accent">
                  Edit position
                </summary>
                <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                  <PositionForm
                    action={saveAction}
                    electionId={electionId}
                    submitLabel="Update position"
                    initialValue={{
                      id: position.id,
                      title: position.title,
                      description: position.description,
                      displayOrder: position.displayOrder,
                    }}
                  />
                  {deleteAction ? (
                    <form action={deleteAction} className="mt-4">
                      <input type="hidden" name="id" value={position.id} />
                      <button
                        type="submit"
                        className="min-h-10 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800"
                      >
                        Delete position
                      </button>
                    </form>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <p className="metric-number text-xs text-slate-500">
              {position.candidateCount ?? 0} candidates
            </p>
            {action ? (
              <div className="flex gap-1">
                {index > 0 ? (
                  <form action={action}>
                    <input type="hidden" name="electionId" value={electionId} />
                    <input
                      type="hidden"
                      name="orderedIds"
                      value={JSON.stringify([
                        ...positions.slice(0, index - 1).map((item) => item.id),
                        position.id,
                        positions[index - 1].id,
                        ...positions.slice(index + 1).map((item) => item.id),
                      ])}
                    />
                    <button
                      type="submit"
                      className="grid size-8 place-items-center rounded-lg border text-slate-600 hover:bg-slate-50"
                      aria-label={`Move ${position.title} up`}
                    >
                      <ArrowUpIcon className="size-4" aria-hidden />
                    </button>
                  </form>
                ) : null}
                {index < positions.length - 1 ? (
                  <form action={action}>
                    <input type="hidden" name="electionId" value={electionId} />
                    <input
                      type="hidden"
                      name="orderedIds"
                      value={JSON.stringify([
                        ...positions.slice(0, index).map((item) => item.id),
                        positions[index + 1].id,
                        position.id,
                        ...positions.slice(index + 2).map((item) => item.id),
                      ])}
                    />
                    <button
                      type="submit"
                      className="grid size-8 place-items-center rounded-lg border text-slate-600 hover:bg-slate-50"
                      aria-label={`Move ${position.title} down`}
                    >
                      <ArrowDownIcon className="size-4" aria-hidden />
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
