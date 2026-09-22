import {
  ChartBarIcon,
  CheckCircleIcon,
  ListNumbersIcon,
  StudentIcon,
  TrendUpIcon,
  UsersThreeIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AdminShell } from "@/components/admin/AdminShell";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { TurnoutByDepartment } from "@/components/admin/TurnoutByDepartment";
import { DashboardCard } from "@/components/DashboardCard";
import { ElectionStatusBadge } from "@/components/ElectionStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getAdminDashboard,
  getAdminResults,
  getDepartmentTurnout,
  getElectionContext,
} from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";

type AdminDashboardPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);

  if (!election) {
    return (
      <AdminShell adminName={admin.displayName} adminRole={admin.role}>
        <PageHeader
          eyebrow="DUCRISA Election control centre"
          title="Dashboard"
          description="Monitor eligibility, turnout, and aggregate election activity."
        />
        <div className="mt-8">
          <EmptyState
            title="No election configured"
            description="Create an election before dashboard metrics can be calculated."
          />
        </div>
      </AdminShell>
    );
  }

  const [metrics, results, departments] = await Promise.all([
    getAdminDashboard(election.id),
    getAdminResults(election.id),
    getDepartmentTurnout(election.id),
  ]);
  const leaderGroups = results.reduce<Map<string, typeof results>>((groups, row) => {
    const rows = groups.get(row.positionId) ?? [];
    rows.push(row);
    groups.set(row.positionId, rows);
    return groups;
  }, new Map());
  const leaders = [...leaderGroups.values()].map(
    (rows) => [...rows].sort((a, b) => b.voteCount - a.voteCount)[0],
  );

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Election control centre"
        title="Dashboard"
        description={`Aggregate activity for ${election.title}. Individual ballots are never shown.`}
        actions={<ElectionStatusBadge status={election.status} />}
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election.id}
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Registered students"
          value={metrics.registeredStudents}
          icon={StudentIcon}
        />
        <DashboardCard
          label="Eligible students"
          value={metrics.eligibleStudents}
          icon={CheckCircleIcon}
        />
        <DashboardCard
          label="Students voted"
          value={metrics.studentsVoted}
          icon={ChartBarIcon}
        />
        <DashboardCard
          label="Voter turnout"
          value={`${metrics.turnoutPercentage.toFixed(1)}%`}
          note={`${metrics.studentsNotVoted} eligible students remaining`}
          icon={TrendUpIcon}
          accent
        />
        <DashboardCard
          label="Anonymous ballots"
          value={metrics.ballotsCast}
          icon={CheckCircleIcon}
        />
        <DashboardCard
          label="Not voted"
          value={metrics.studentsNotVoted}
          icon={XCircleIcon}
        />
        <DashboardCard
          label="Candidates"
          value={metrics.totalCandidates}
          icon={UsersThreeIcon}
        />
        <DashboardCard
          label="Positions"
          value={metrics.totalPositions}
          icon={ListNumbersIcon}
        />
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TurnoutByDepartment departments={departments} />
        <section className="rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy">
            Current leaders
          </h2>
          <div className="mt-5 divide-y">
            {leaders.map((leader) => (
              <div
                key={leader.positionId}
                className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {leader.positionTitle}
                  </p>
                  <p className="mt-1 font-semibold text-navy">{leader.candidateName}</p>
                </div>
                <p className="metric-number self-center text-sm font-semibold text-accent">
                  {leader.voteCount} votes
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
