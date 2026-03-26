"use client";

import { money } from "@/lib/format";
import { useCallback, useEffect, useMemo, useState } from "react";

type Category = { id: string; name: string };
type Transaction = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  date: string;
  description: string | null;
  category_name?: string | null;
};

export function TransactionsManager() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "",
    categoryId: "",
    sort: "newest",
  });

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.startDate) p.set("startDate", filters.startDate);
    if (filters.endDate) p.set("endDate", filters.endDate);
    if (filters.type) p.set("type", filters.type);
    if (filters.categoryId) p.set("categoryId", filters.categoryId);
    if (filters.sort) p.set("sort", filters.sort);
    return p.toString();
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${query}`),
      fetch("/api/categories"),
    ]);

    if (!txRes.ok || !catRes.ok) {
      setError("Failed to load transactions.");
      setLoading(false);
      return;
    }

    const tx = (await txRes.json()) as { transactions: Transaction[] };
    const cat = (await catRes.json()) as { categories: Category[] };

    setItems(tx.transactions);
    setCategories(cat.categories);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTransaction(formData: FormData) {
    const payload = {
      amount: Number(formData.get("amount")),
      type: String(formData.get("type") || "expense"),
      category_id: String(formData.get("category_id") || ""),
      date: String(formData.get("date") || ""),
      description: String(formData.get("description") || ""),
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await load();
    }
  }

  async function deleteTransaction(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function updateTransaction(id: string, formData: FormData) {
    const payload = {
      amount: Number(formData.get("amount")),
      type: String(formData.get("type") || "expense"),
      category_id: String(formData.get("category_id") || ""),
      date: String(formData.get("date") || ""),
      description: String(formData.get("description") || ""),
    };

    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditingId(null);
      await load();
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <form
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-6"
        action={async (formData) => {
          await createTransaction(formData);
        }}
      >
        <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount" className="rounded-md border border-zinc-300 px-3 py-2" />
        <select name="type" className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select name="category_id" className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="date" type="date" required className="rounded-md border border-zinc-300 px-3 py-2" />
        <input name="description" maxLength={180} placeholder="Description" className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-white hover:bg-zinc-700 md:col-span-6" type="submit">Add transaction</button>
      </form>

      <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-5">
        <input type="date" value={filters.startDate} onChange={(e) => setFilters((v) => ({ ...v, startDate: e.target.value }))} className="rounded-md border border-zinc-300 px-3 py-2" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters((v) => ({ ...v, endDate: e.target.value }))} className="rounded-md border border-zinc-300 px-3 py-2" />
        <select value={filters.type} onChange={(e) => setFilters((v) => ({ ...v, type: e.target.value }))} className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.categoryId} onChange={(e) => setFilters((v) => ({ ...v, categoryId: e.target.value }))} className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filters.sort} onChange={(e) => setFilters((v) => ({ ...v, sort: e.target.value }))} className="rounded-md border border-zinc-300 px-3 py-2">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest amount</option>
          <option value="lowest">Lowest amount</option>
        </select>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading transactions...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && items.length === 0 && <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">No transactions found.</p>}

      <div className="space-y-2">
        {items.map((t) => {
          const editing = editingId === t.id;
          return (
            <div key={t.id} className="rounded-xl border border-zinc-200 bg-white p-3">
              {editing ? (
                <form
                  className="grid gap-2 md:grid-cols-6"
                  action={async (formData) => {
                    await updateTransaction(t.id, formData);
                  }}
                >
                  <input name="amount" type="number" step="0.01" min="0" defaultValue={t.amount} required className="rounded-md border border-zinc-300 px-3 py-2" />
                  <select name="type" defaultValue={t.type} className="rounded-md border border-zinc-300 px-3 py-2">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <select name="category_id" defaultValue={t.category_id || ""} className="rounded-md border border-zinc-300 px-3 py-2">
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input name="date" type="date" defaultValue={t.date} required className="rounded-md border border-zinc-300 px-3 py-2" />
                  <input name="description" defaultValue={t.description || ""} className="rounded-md border border-zinc-300 px-3 py-2 md:col-span-2" />
                  <div className="flex gap-2 md:col-span-6">
                    <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-white">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-zinc-300 px-3 py-2">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.description || "No description"}</p>
                    <p className="text-sm text-zinc-500">{t.date} · {t.category_name || "Uncategorized"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={t.type === "expense" ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>
                      {t.type === "expense" ? "-" : "+"}{money(t.amount)}
                    </p>
                    <button type="button" onClick={() => setEditingId(t.id)} className="rounded-md border border-zinc-300 px-2 py-1 text-sm">Edit</button>
                    <button type="button" onClick={() => deleteTransaction(t.id)} className="rounded-md border border-rose-300 px-2 py-1 text-sm text-rose-600">Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
