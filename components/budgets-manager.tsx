"use client";

import { money } from "@/lib/format";
import { useEffect, useMemo, useState } from "react";

type Budget = {
  id: string;
  amount: number;
  month: number;
  year: number;
  category_id: string | null;
  category_name?: string | null;
  spent?: number;
};

type Category = { id: string; name: string };

export function BudgetsManager() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const query = useMemo(() => `month=${month}&year=${year}`, [month, year]);

  async function load() {
    const [budgetRes, catRes] = await Promise.all([
      fetch(`/api/budgets?${query}`),
      fetch("/api/categories"),
    ]);

    if (budgetRes.ok) {
      const data = (await budgetRes.json()) as { budgets: Budget[] };
      setItems(data.budgets);
    }

    if (catRes.ok) {
      const data = (await catRes.json()) as { categories: Category[] };
      setCategories(data.categories);
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  async function createBudget(formData: FormData) {
    const payload = {
      amount: Number(formData.get("amount")),
      category_id: String(formData.get("category_id") || ""),
      month,
      year,
    };

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) await load();
  }

  async function removeBudget(id: string) {
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Budgets</h1>

      <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
        <input type="number" min={2000} max={3000} value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-md border border-zinc-300 px-3 py-2" />
      </div>

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-3"
        action={async (formData) => {
          await createBudget(formData);
        }}
      >
        <input name="amount" type="number" min="0" step="0.01" required placeholder="Budget amount" className="rounded-md border border-zinc-300 px-3 py-2" />
        <select name="category_id" className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">Overall monthly budget</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-700">Save budget</button>
      </form>

      {items.length === 0 && <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No budgets found for selected month.</p>}

      <div className="space-y-2">
        {items.map((b) => {
          const spent = Number(b.spent || 0);
          const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
          const warning = percent >= 100 ? "Exceeded" : percent >= 80 ? "Near limit" : "Healthy";
          return (
            <div key={b.id} className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{b.category_name || "Overall"}</p>
                  <p className="text-sm text-zinc-500">Spent {money(spent)} of {money(b.amount)} · {warning}</p>
                </div>
                <button onClick={() => removeBudget(b.id)} type="button" className="rounded-md border border-rose-300 px-2 py-1 text-sm text-rose-600">Delete</button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                <div className={`${percent >= 100 ? "bg-rose-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"} h-full`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
