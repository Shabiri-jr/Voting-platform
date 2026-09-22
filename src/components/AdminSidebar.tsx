import {
  IdentificationBadgeIcon,
  SignOutIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Logo } from "@/components/shared/Logo";

type AdminSidebarProps = {
  adminName?: string;
  adminRole?: string;
};

export function AdminSidebar({
  adminName = "Election Administrator",
  adminRole = "election_officer",
}: AdminSidebarProps) {
  return (
    <>
      <div className="no-print bg-navy text-white lg:hidden">
        <div className="flex h-20 items-center justify-between px-4 sm:px-6">
          <Logo inverse />
          <details className="relative">
            <summary className="list-none rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold">
              Admin menu
            </summary>
            <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-white/10 bg-navy p-3 shadow-2xl">
              <nav aria-label="Admin navigation">
                <AdminNavigation />
              </nav>
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="flex items-center gap-3 px-3 py-2">
                  <IdentificationBadgeIcon
                    className="size-5 shrink-0 text-brand-300"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{adminName}</p>
                    <p className="truncate text-xs capitalize text-white/50">
                      {adminRole.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <form action="/api/admin/logout" method="post">
                  <button
                    type="submit"
                    className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <SignOutIcon className="size-5" aria-hidden />
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </details>
        </div>
      </div>
      <aside className="no-print fixed inset-y-0 left-0 hidden w-72 flex-col bg-navy text-white lg:flex">
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <Logo inverse />
        </div>
        <nav aria-label="Admin navigation" className="flex-1 px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
            Administration
          </p>
          <AdminNavigation />
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10">
              <IdentificationBadgeIcon
                className="size-5 text-brand-300"
                aria-hidden
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{adminName}</p>
              <p className="truncate text-xs capitalize text-white/50">
                {adminRole.replace("_", " ")}
              </p>
            </div>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <SignOutIcon className="size-5" aria-hidden />
              Log out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
