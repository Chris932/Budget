import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">BudgetTrack</h1>
        <p className="mt-3 text-zinc-600">
          Track income, expenses, and budgets with a clean, secure multi-user app powered by Next.js and Turso.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup" className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
            Create account
          </Link>
          <Link href="/login" className="rounded-md border border-zinc-300 px-4 py-2 hover:bg-zinc-100">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
