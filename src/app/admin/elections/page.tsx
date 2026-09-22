import {
  changeElectionStatusAction,
  saveElectionAction,
} from "@/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ElectionControls } from "@/components/admin/ElectionControls";
import { ElectionList } from "@/components/admin/ElectionList";
import { ElectionSettingsForm } from "@/components/admin/ElectionSettingsForm";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { PermissionNotice } from "@/components/admin/PermissionNotice";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PageHeader } from "@/components/shared/PageHeader";
import { getElectionContext } from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";
import { formatLagosDateTime } from "@/lib/date";
import { redirect } from "next/navigation";

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() + 60 * 60_000).toISOString().slice(0, 16);
}

function defaultReopenEndTime(value: string) {
  const minimumEndTime = Date.now() + 60 * 60_000;
  const requestedEndTime = new Date(value).getTime();
  return localDateTime(
    new Date(Math.max(requestedEndTime, minimumEndTime)).toISOString(),
  );
}

type ElectionsPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function ElectionsPage({
  searchParams,
}: ElectionsPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);
  const canEdit = admin.role !== "viewer";

  async function saveElection(formData: FormData) {
    "use server";
    const result = await saveElectionAction(formData);
    if (!formData.get("id") && result.success && result.data) {
      redirect(`/admin/elections?electionId=${result.data.electionId}`);
    }
    return result;
  }
  async function changeStatus(formData: FormData) {
    "use server";
    return changeElectionStatusAction(formData);
  }

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Election operations"
        title="Election settings"
        description="Create separate elections for each term, month, or year, then manage the selected election."
        actions={
          canEdit && election ? (
            <ButtonLink href="#create-election">Create another election</ButtonLink>
          ) : null
        }
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election?.id}
      />
      {!canEdit ? <div className="mt-6"><PermissionNotice /></div> : null}
      {election ? (
        <div className="mt-7 space-y-5">
          <ElectionControls
            electionId={election.id}
            status={election.status}
            endTime={election.endTime}
            reopenEndTime={defaultReopenEndTime(election.endTime)}
            action={changeStatus}
            readOnly={!canEdit}
          />
          <ResourcePanel
            title="Election details"
            description={
              election.status === "pending"
                ? "Dates and descriptive details may be updated before opening."
                : "Configuration is restricted after voting begins."
            }
            defaultOpen
          >
            {canEdit && election.status === "pending" ? (
              <ElectionSettingsForm
                action={saveElection}
                election={{
                  ...election,
                  startTime: localDateTime(election.startTime),
                  endTime: localDateTime(election.endTime),
                }}
              />
            ) : (
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Starts
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-navy">
                    {formatLagosDateTime(election.startTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ends
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-navy">
                    {formatLagosDateTime(election.endTime)}
                  </dd>
                </div>
              </dl>
            )}
          </ResourcePanel>
        </div>
      ) : null}
      {canEdit ? (
        <div id="create-election" className="mt-7 scroll-mt-6">
          <ResourcePanel
            title={election ? "Create another election" : "Create election"}
            description="A new election starts with no positions, candidates, votes, or participation records."
            defaultOpen={!election}
          >
            <ElectionSettingsForm action={saveElection} />
          </ResourcePanel>
        </div>
      ) : null}
      {elections.length ? (
        <div className="mt-7">
          <ElectionList
            elections={elections}
            selectedElectionId={election?.id}
          />
        </div>
      ) : null}
    </AdminShell>
  );
}
