import Link from "next/link";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/shared/Logo";

export function Navbar() {
  return (
    <header className="border-b border-white/10 bg-navy text-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo inverse />
        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          <Link
            href="/verify"
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:block"
          >
            Start voting
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-sm font-semibold transition hover:bg-white/10 active:translate-y-px"
          >
            <LockKeyIcon className="size-4" aria-hidden />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
