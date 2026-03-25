import { money } from "@/lib/format";

export function BudgetProgress({
  label,
  spent,
  budget,
}: {
  label: string;
  spent: number;
  budget: number;
}) {
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const clamped = Math.min(100, Math.max(0, percent));
  const tone = percent >= 100 ? "bg-rose-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-zinc-500">
          {money(spent)} / {money(budget)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div className={`h-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{percent}% used</p>
    </div>
  );
}
