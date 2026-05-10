import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-5 px-5 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-[var(--color-brand-primary)]">404</p>
        <h1 className="text-3xl font-black">Page not found</h1>
        <p className="text-sm leading-6 text-[var(--color-text-muted)]">
          That page is not on today&apos;s card.
        </p>
        <Link
          href="/card"
          className="rounded-xl bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-black text-white transition hover:bg-red-500"
        >
          Back to The Card
        </Link>
      </div>
    </main>
  );
}
