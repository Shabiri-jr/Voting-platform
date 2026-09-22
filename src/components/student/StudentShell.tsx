import { Logo } from "@/components/shared/Logo";

type StudentShellProps = {
  children: React.ReactNode;
  step?: string;
};

export function StudentShell({ children, step }: StudentShellProps) {
  return (
    <main id="main-content" className="min-h-[100dvh] bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          {step ? (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {step}
            </p>
          ) : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 md:py-14">
        {children}
      </div>
    </main>
  );
}
