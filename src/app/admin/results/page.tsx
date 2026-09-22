import { DownloadSimpleIcon, PrinterIcon } from "@phosphor-icons/react/dist/ssr";
import { AdminShell } from "@/components/admin/AdminShell";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { ResultChart, type ResultItem } from "@/components/ResultChart";
import { ResultsTable } from "@/components/ResultsTable";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAdminResults, getElectionContext } from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";
import { rankResults } from "@/lib/results";

type ResultsPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);
  const rows = election ? await getAdminResults(election.id) : [];
  const groupedRows = rows.reduce<Map<string, typeof rows>>((groups, row) => {
    const positionRows = groups.get(row.positionId) ?? [];
    positionRows.push(row);
    groups.set(row.positionId, positionRows);
    return groups;
  }, new Map());
  const groups = [...groupedRows.values()].map(
    (positionRows) => {
      return {
        id: positionRows[0].positionId,
        title: positionRows[0].positionTitle,
        order: positionRows[0].positionOrder,
        results: rankResults(positionRows) satisfies ResultItem[],
      };
    },
  ).sort((a, b) => a.order - b.order);

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Aggregate counting"
        title="Election results"
        description={`Totals for ${election?.title ?? "the selected election"} are grouped by position. Raw ballots and student identities are not available.`}
        actions={
          election ? (
            <>
              <form action="/api/admin/results/export" method="post">
                <input type="hidden" name="electionId" value={election.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-slate-50"
                >
                  <DownloadSimpleIcon className="mr-2 size-4" aria-hidden />
                  Export CSV
                </button>
              </form>
              <ButtonLink
                href={`/admin/results/print?electionId=${election.id}`}
                variant="secondary"
              >
                <PrinterIcon className="mr-2 size-4" aria-hidden />
                Print / PDF
              </ButtonLink>
            </>
          ) : null
        }
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election?.id}
      />
      <div className="mt-8 space-y-10">
        {groups.length ? (
          groups.map((group) => (
            <section key={group.id} className="space-y-4">
              <ResultChart title={group.title} results={group.results} />
              <ResultsTable
                results={group.results}
                final={election?.status === "closed"}
              />
            </section>
          ))
        ) : (
          <EmptyState
            title="No result data"
            description="Results will appear after candidates are configured and ballots are submitted."
          />
        )}
      </div>
    </AdminShell>
  );
}
