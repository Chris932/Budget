"use client";

import { money } from "@/lib/format";
import { useEffect, useMemo, useState } from "react";

type ReportData = {
  month: number;
  year: number;
  summary: { income: number; expense: number };
  previous: { income: number; expense: number };
  categoryBreakdown: Array<{ category: string; amount: number }>;
  budgetUsage: Array<{ budget_name: string; budget_amount: number; spent: number }>;
};

export function ReportsView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => `month=${month}&year=${year}`, [month, year]);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const res = await fetch(`/api/reports/summary?${query}`);
      if (res.ok) {
        setData((await res.json()) as ReportData);
      }
      setLoading(false);
    }
    void run();
  }, [query]);

  const income = Number(data?.summary?.income || 0);
  const expense = Number(data?.summary?.expense || 0);
  const prevIncome = Number(data?.previous?.income || 0);
  const prevExpense = Number(data?.previous?.expense || 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Reports & Insights</h1>

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
        <input type="number" min={2000} max={3000} value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading report...</p>}
      {!loading && !data && <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No report data.</p>}

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Monthly income</p>
              <p className="mt-1 text-xl font-semibold text-emerald-600">{money(income)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Monthly expense</p>
              <p className="mt-1 text-xl font-semibold text-rose-600">{money(expense)}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-500">Income vs expense</p>
              <p className="mt-1 text-xl font-semibold text-blue-600">{money(income - expense)}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Category spending breakdown</h2>
              <div className="mt-3 space-y-2 text-sm">
                {data.categoryBreakdown.length === 0 && <p className="text-zinc-500">No expense data.</p>}
                {data.categoryBreakdown.map((row) => (
                  <div key={row.category} className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                    <span>{row.category}</span>
                    <span>{money(Number(row.amount))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Budget usage overview</h2>
              <div className="mt-3 space-y-2 text-sm">
                {data.budgetUsage.length === 0 && <p className="text-zinc-500">No budgets set.</p>}
                {data.budgetUsage.map((row) => (
                  <div key={row.budget_name} className="rounded-md border border-zinc-200 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{row.budget_name}</span>
                      <span>{money(Number(row.spent))} / {money(Number(row.budget_amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <h2 className="text-lg font-semibold">Month-over-month comparison</h2>
            <p className="mt-2 text-zinc-700">
              Income: {money(income)} vs {money(prevIncome)} previous month
            </p>
            <p className="text-zinc-700">
              Expense: {money(expense)} vs {money(prevExpense)} previous month
            </p>
          </div>
        </>
      )}
    </div>
  );
}
