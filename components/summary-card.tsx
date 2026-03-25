import { money } from "@/lib/format";

export function SummaryCard({
  title,
  amount,
  accent,
}: {
  title: string;
  amount: number;
  accent?: "green" | "red" | "blue" | "amber";
}) {
  const tone =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
        ? "text-rose-600"
        : accent === "amber"
          ? "text-amber-600"
          : "text-blue-600";

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{money(amount)}</p>
    </div>
  );
}
