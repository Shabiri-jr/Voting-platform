import { AdminSidebar } from "@/components/AdminSidebar";

type AdminShellProps = {
  children: React.ReactNode;
  adminName?: string;
  adminRole?: string;
};

export function AdminShell({
  children,
  adminName,
  adminRole,
}: AdminShellProps) {
  return (
    <div className="min-h-[100dvh] bg-slate-100">
      <AdminSidebar adminName={adminName} adminRole={adminRole} />
      <main id="main-content" className="lg:pl-72">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
