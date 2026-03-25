import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail } from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const format = req.nextUrl.searchParams.get("format") || "json";

  const [categories, transactions, budgets, user] = await Promise.all([
    db.execute({
      sql: `SELECT id, name, created_at FROM categories WHERE user_id = ? ORDER BY name`,
      args: [auth.userId],
    }),
    db.execute({
      sql: `SELECT id, category_id, amount, type, date, description, created_at
            FROM transactions WHERE user_id = ? ORDER BY date DESC`,
      args: [auth.userId],
    }),
    db.execute({
      sql: `SELECT id, category_id, amount, month, year, created_at
            FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC`,
      args: [auth.userId],
    }),
    db.execute({
      sql: `SELECT email, name, monthly_target_budget, created_at
            FROM users WHERE id = ? LIMIT 1`,
      args: [auth.userId],
    }),
  ]);

  if (format === "csv") {
    const header = "id,date,type,amount,category_id,description\n";
    const lines = transactions.rows
      .map((r) =>
        [r.id, r.date, r.type, r.amount, r.category_id || "", String(r.description || "").replaceAll(",", " ")].join(",")
      )
      .join("\n");

    return new NextResponse(header + lines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=budgettrack-transactions.csv",
      },
    });
  }

  const payload = {
    user: user.rows[0],
    categories: categories.rows,
    transactions: transactions.rows,
    budgets: budgets.rows,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=budgettrack-data.json",
    },
  });
}
