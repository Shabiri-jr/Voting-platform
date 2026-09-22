"use client";

import { PrinterIcon } from "@phosphor-icons/react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
    >
      <PrinterIcon className="size-4" aria-hidden />
      Print or save as PDF
    </button>
  );
}
