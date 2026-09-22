import {
  deletePositionAction,
  reorderPositionsAction,
  savePositionAction,
} from "@/actions/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ElectionSwitcher } from "@/components/admin/ElectionSwitcher";
import { PermissionNotice } from "@/components/admin/PermissionNotice";
import { PositionList } from "@/components/admin/PositionList";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { PositionForm } from "@/components/PositionForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getElectionContext,
  listCandidates,
  listPositions,
} from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";

type PositionsPageProps = {
  searchParams: Promise<{ electionId?: string }>;
};

export default async function PositionsPage({
  searchParams,
}: PositionsPageProps) {
  const admin = await guardAdminPage();
  const params = await searchParams;
  const { elections, election } = await getElectionContext(params.electionId);
  const positions = election ? await listPositions(election.id) : [];
  const candidates = election ? await listCandidates(election.id) : [];
  const canEdit = admin.role !== "viewer" && election?.status === "pending";

  async function savePosition(formData: FormData) {
    "use server";
    return savePositionAction(formData);
  }
  async function reorderPositions(formData: FormData) {
    "use server";
    await reorderPositionsAction(formData);
  }
  async function deletePosition(formData: FormData) {
    "use server";
    await deletePositionAction(formData);
  }

  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Ballot configuration"
        title="Election positions"
        description={`Set the ballot order for ${election?.title ?? "the selected election"}. Configuration freezes when voting opens.`}
      />
      <ElectionSwitcher
        elections={elections}
        selectedElectionId={election?.id}
      />
      {admin.role === "viewer" ? <div className="mt-6"><PermissionNotice /></div> : null}
      {canEdit && election ? (
        <div className="mt-7">
          <ResourcePanel title="Add a position" description="Create a new ballot office.">
            <PositionForm
              action={savePosition}
              electionId={election.id}
              initialValue={{ displayOrder: positions.length + 1 }}
            />
          </ResourcePanel>
        </div>
      ) : null}
      <div className="mt-7">
        {positions.length ? (
          <PositionList
            electionId={election?.id ?? ""}
            action={canEdit ? reorderPositions : undefined}
            saveAction={canEdit ? savePosition : undefined}
            deleteAction={canEdit ? deletePosition : undefined}
            positions={positions.map((position) => ({
              ...position,
              candidateCount: candidates.filter(
                (candidate) => candidate.positionId === position.id,
              ).length,
            }))}
          />
        ) : (
          <EmptyState
            title="No positions configured"
            description="Add the first election position before adding candidates."
          />
        )}
      </div>
    </AdminShell>
  );
}
