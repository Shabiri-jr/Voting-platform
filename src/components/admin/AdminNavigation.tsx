"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChartBarIcon,
  ClipboardTextIcon,
  GearSixIcon,
  ListNumbersIcon,
  SquaresFourIcon,
  StudentIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFourIcon },
  { href: "/admin/students", label: "Students", icon: StudentIcon },
  { href: "/admin/positions", label: "Positions", icon: ListNumbersIcon },
  { href: "/admin/candidates", label: "Candidates", icon: UsersThreeIcon },
  { href: "/admin/elections", label: "Election settings", icon: GearSixIcon },
  { href: "/admin/results", label: "Results", icon: ChartBarIcon },
  { href: "/admin/audit-logs", label: "Audit logs", icon: ClipboardTextIcon },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const electionId = searchParams.get("electionId");

  return (
    <ul className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const destination = electionId
          ? `${href}?electionId=${encodeURIComponent(electionId)}`
          : href;

        return (
          <li key={href}>
            <Link
              href={destination}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white text-navy"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Icon
                className="size-5 shrink-0"
                weight={active ? "fill" : "regular"}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
