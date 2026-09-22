import { PageSkeleton } from "@/components/shared/PageSkeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-5xl px-4 py-12 sm:px-6">
      <PageSkeleton />
    </main>
  );
}
