import {
  deleteCandidateAction,
  saveCandidateAction,
} from "@/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { CandidateList } from "@/components/admin/CandidateList";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { PermissionNotice } from "@/components/admin/PermissionNotice";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { CandidateForm } from "@/components/CandidateForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getElectionContext,
  listCandidates,
  listPositions,
} from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";

type CandidatesPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function CandidatesPage({
  searchParams,
}: CandidatesPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);
  const [positions, candidates] = election
    ? await Promise.all([listPositions(election.id), listCandidates(election.id)])
    : [[], []];
  const canEdit = admin.role !== "viewer" && election?.status === "pending";

  async function saveCandidate(formData: FormData) {
    "use server";
    return saveCandidateAction(formData);
  }
  async function deleteCandidate(formData: FormData) {
    "use server";
    await deleteCandidateAction(formData);
  }

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Ballot configuration"
        title="Candidates"
        description={`Manage candidates for ${election?.title ?? "the selected election"} and assign each person to a position.`}
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election?.id}
      />
      {admin.role === "viewer" ? <div className="mt-6"><PermissionNotice /></div> : null}
      {canEdit && positions.length ? (
        <div className="mt-7">
          <ResourcePanel title="Add a candidate" description="Create a ballot profile.">
            <CandidateForm
              action={saveCandidate}
              positions={positions.map(({ id, title }) => ({ id, title }))}
            />
          </ResourcePanel>
        </div>
      ) : null}
      <div className="mt-7">
        {candidates.length ? (
          <CandidateList
            positions={positions.map(({ id, title }) => ({ id, title }))}
            saveAction={canEdit ? saveCandidate : undefined}
            deleteAction={canEdit ? deleteCandidate : undefined}
            candidates={candidates.map((candidate) => ({
              ...candidate,
              positionTitle:
                positions.find((position) => position.id === candidate.positionId)
                  ?.title ?? "Unknown position",
            }))}
          />
        ) : (
          <EmptyState
            title="No candidates configured"
            description="Add positions first, then create candidate profiles."
          />
        )}
      </div>
    </AdminShell>
  );
}
