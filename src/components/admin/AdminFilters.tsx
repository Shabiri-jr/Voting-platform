import { FunnelSimpleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";

const academicLevels = ["100L", "200L", "300L", "400L", "500L", "600L"] as const;

type AdminFiltersProps = {
  departments?: string[];
  electionId?: string;
  showLevel?: boolean;
  showVoteStatus?: boolean;
};

export function AdminFilters({
  departments = [],
  electionId,
  showLevel = false,
  showVoteStatus = false,
}: AdminFiltersProps) {
  return (
    <form className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[minmax(14rem,1fr)_repeat(3,auto)_auto]">
      {electionId ? (
        <input type="hidden" name="electionId" value={electionId} />
      ) : null}
      <label className="relative">
        <span className="sr-only">Search students</span>
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          placeholder="Search name, matric or department"
          className="min-h-10 w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none"
        />
      </label>
      {departments.length ? (
        <select
          name="department"
          aria-label="Filter by department"
          className="min-h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      ) : null}
      {showLevel ? (
        <select
          name="level"
          aria-label="Filter by level"
          className="min-h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="">All levels</option>
          {academicLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      ) : null}
      {showVoteStatus ? (
        <select
          name="voted"
          aria-label="Filter by voting status"
          className="min-h-10 rounded-lg border bg-white px-3 text-sm"
        >
          <option value="">All voting statuses</option>
          <option value="true">Voted</option>
          <option value="false">Not voted</option>
        </select>
      ) : null}
      <button
        type="submit"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-sm font-semibold text-white"
      >
        <FunnelSimpleIcon className="size-4" aria-hidden />
        Apply
      </button>
    </form>
  );
}
