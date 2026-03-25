import { BudgetProgress } from "@/components/budget-progress";
import { SummaryCard } from "@/components/summary-card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { money } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total balance" amount={data.summary.balance} accent="blue" />
        <SummaryCard title="Income this month" amount={data.summary.incomeMonth} accent="green" />
        <SummaryCard title="Expenses this month" amount={data.summary.expensesMonth} accent="red" />
        <SummaryCard title="Remaining budget" amount={data.summary.remainingBudget} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Insights</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>
              Top spending category: <strong>{data.summary.topSpendingCategory}</strong>
            </li>
            <li>
              Over budget this month: <strong>{data.summary.overBudget ? "Yes" : "No"}</strong>
            </li>
            <li>
              Monthly trend: <strong>{data.trend.length > 1 ? "Data available" : "Need more data"}</strong>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Income vs Expense Trend (last 6 months)</h2>
          <div className="mt-3 space-y-2 text-sm">
            {data.trend.length === 0 && <p className="text-zinc-500">No trend data yet.</p>}
            {data.trend.map((row) => (
              <div key={String(row.month)} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <span>{String(row.month)}</span>
                <span>
                  {money(Number(row.income))} / {money(Number(row.expense))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <div className="mt-3 space-y-2 text-sm">
            {data.recentTransactions.length === 0 && <p className="text-zinc-500">No transactions yet.</p>}
            {data.recentTransactions.map((t) => (
              <div key={String(t.id)} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2">
                <div>
                  <p className="font-medium">{String(t.description || "No description")}</p>
                  <p className="text-zinc-500">{String(t.category_name || "Uncategorized")} · {String(t.date)}</p>
                </div>
                <p className={String(t.type) === "expense" ? "text-rose-600" : "text-emerald-600"}>
                  {String(t.type) === "expense" ? "-" : "+"}
                  {money(Number(t.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Budget Progress</h2>
          {data.budgetProgress.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
              No budgets set for this month.
            </div>
          )}
          {data.budgetProgress.map((b) => (
            <BudgetProgress
              key={String(b.id)}
              label={String(b.category_name || "Overall")}
              spent={Number(b.spent)}
              budget={Number(b.amount)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
