"use client";

import { useEffect, useState } from "react";

type Profile = {
  email: string;
  name: string | null;
  monthly_target_budget: number;
};

type Category = { id: string; name: string };

export function SettingsManager() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/settings/profile"),
      fetch("/api/categories"),
    ]);

    if (pRes.ok) {
      const data = (await pRes.json()) as Profile;
      setProfile(data);
    }

    if (cRes.ok) {
      const data = (await cRes.json()) as { categories: Category[] };
      setCategories(data.categories);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveProfile(formData: FormData) {
    const res = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
      }),
    });

    if (res.ok) {
      setMessage("Profile saved.");
      await load();
    }
  }

  async function saveTarget(formData: FormData) {
    const res = await fetch("/api/settings/target-budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(formData.get("monthly_target_budget")) }),
    });
    if (res.ok) {
      setMessage("Monthly target updated.");
      await load();
    }
  }

  async function createCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      setNewCategory("");
      await load();
    }
  }

  async function renameCategory(id: string, current: string) {
    const name = prompt("Rename category", current);
    if (!name) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) await load();
  }

  async function removeCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function resetData() {
    if (!confirm("Delete all your budgets, categories, and transactions?")) return;
    const res = await fetch("/api/settings/reset", { method: "POST" });
    if (res.ok) {
      setMessage("All data reset.");
      await load();
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <form className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4" action={saveProfile}>
        <h2 className="text-lg font-semibold">Profile</h2>
        <input name="name" defaultValue={profile?.name || ""} placeholder="Name" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        <input name="email" type="email" defaultValue={profile?.email || ""} required placeholder="Email" className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-white">Save profile</button>
      </form>

      <form className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4" action={saveTarget}>
        <h2 className="text-lg font-semibold">Monthly target budget</h2>
        <input name="monthly_target_budget" type="number" min="0" step="0.01" defaultValue={profile?.monthly_target_budget || 0} className="w-full rounded-md border border-zinc-300 px-3 py-2" />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-white">Save target</button>
      </form>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Manage categories</h2>
        <div className="flex gap-2">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" className="flex-1 rounded-md border border-zinc-300 px-3 py-2" />
          <button type="button" onClick={createCategory} className="rounded-md bg-zinc-900 px-3 py-2 text-white">Add</button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm">
              <span>{c.name}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => renameCategory(c.id, c.name)} className="rounded-md border border-zinc-300 px-2 py-1">Edit</button>
                <button type="button" onClick={() => removeCategory(c.id)} className="rounded-md border border-rose-300 px-2 py-1 text-rose-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Export</h2>
        <div className="flex flex-wrap gap-2">
          <a className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" href="/api/settings/export?format=json">Export JSON</a>
          <a className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" href="/api/settings/export?format=csv">Export CSV</a>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
        <button type="button" onClick={resetData} className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700">Reset all data</button>
      </div>
    </div>
  );
}
