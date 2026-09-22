import { formatLagosDateTime } from "@/lib/date";

export type AuditRow = {
  id: string;
  adminName: string;
  action: string;
  details: string;
  createdAt: string;
};

export function AuditLogTable({ entries }: { entries: AuditRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Administrator activity log</caption>
        <thead>
          <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-5 py-4 font-semibold">Time</th>
            <th scope="col" className="px-5 py-4 font-semibold">Administrator</th>
            <th scope="col" className="px-5 py-4 font-semibold">Action</th>
            <th scope="col" className="px-5 py-4 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="metric-number whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                {formatLagosDateTime(entry.createdAt)}
              </td>
              <td className="px-5 py-4 font-medium text-navy">{entry.adminName}</td>
              <td className="px-5 py-4">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {entry.action.replaceAll("_", " ")}
                </span>
              </td>
              <td className="max-w-md px-5 py-4 leading-6 text-slate-600">
                {entry.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
