import { AdminShell } from "@/components/admin/AdminShell";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { listAuditLogs } from "@/lib/admin";
import { guardAdminPage } from "@/lib/auth";

export default async function AuditLogsPage() {
  const admin = await guardAdminPage();
  const entries = await listAuditLogs();
  return (
    <AdminShell adminName={admin.displayName} adminRole={admin.role}>
      <PageHeader
        eyebrow="Accountability"
        title="Audit logs"
        description="A chronological record of administrator actions. Ballot choices and voting-session secrets are prohibited from this log."
      />
      <div className="mt-8">
        {entries.length ? (
          <AuditLogTable entries={entries} />
        ) : (
          <EmptyState
            title="No audit events"
            description="Administrative activity will appear here."
          />
        )}
      </div>
    </AdminShell>
  );
}
