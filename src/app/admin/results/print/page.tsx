import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { ResultsTable } from "@/components/ResultsTable";
import { Logo } from "@/components/shared/Logo";
import { getAdminResults, listElections } from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/date";
import { rankResults } from "@/lib/results";
import { uuidSchema } from "@/lib/validation";

type PrintResultsPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function PrintResultsPage({
  searchParams,
}: PrintResultsPageProps) {
  await guardAdminPage();
  const params = await searchParams;
  const elections = await listElections();
  const primary =
    elections.find((election) => election.status === "open") ??
    elections[0] ??
    null;
  const parsedId = uuidSchema.safeParse(params.electionId ?? primary?.id);
  if (!parsedId.success) notFound();
  const rows = await getAdminResults(parsedId.data);
  const election = elections.find((item) => item.id === parsedId.data);
  if (!election) notFound();
  if (!rows.length) notFound();
  const groupedRows = rows.reduce<Map<string, typeof rows>>((groups, row) => {
    const values = groups.get(row.positionId) ?? [];
    values.push(row);
    groups.set(row.positionId, values);
    return groups;
  }, new Map());

  return (
    <main className="mx-auto max-w-5xl bg-white px-5 py-8 sm:px-10">
      <header className="flex items-start justify-between gap-6 border-b pb-6">
        <div>
          <Logo />
          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-navy">
            {rows[0].electionTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Aggregate result summary generated {formatLagosDateTime(new Date())}
          </p>
        </div>
        <PrintButton />
      </header>
      <div className="mt-8 space-y-10">
        {[...groupedRows.values()].map((positionRows) => {
          return (
            <section key={positionRows[0].positionId}>
              <h2 className="mb-4 text-xl font-semibold text-navy">
                {positionRows[0].positionTitle}
              </h2>
              <ResultsTable
                final={election.status === "closed"}
                results={rankResults(positionRows)}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
