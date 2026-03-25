import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, parseMoney, parseMonthYear } from "@/lib/validation";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const now = new Date();
  const search = req.nextUrl.searchParams;
  const parsed = parseMonthYear(
    search.get("month") ?? now.getMonth() + 1,
    search.get("year") ?? now.getFullYear()
  );

  if (!parsed) return fail("Invalid month/year values.");

  const prefix = `${parsed.year}-${String(parsed.month).padStart(2, "0")}`;

  const result = await db.execute({
    sql: `SELECT b.id, b.user_id, b.category_id, b.amount, b.month, b.year, b.created_at,
            c.name as category_name,
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.user_id = b.user_id
                AND t.type = 'expense'
                AND (b.category_id IS NULL OR t.category_id = b.category_id)
                AND substr(t.date,1,7) = ?
            ), 0) as spent
          FROM budgets b
          LEFT JOIN categories c ON c.id = b.category_id
          WHERE b.user_id = ? AND b.month = ? AND b.year = ?
          ORDER BY category_name IS NULL, category_name`,
    args: [prefix, auth.userId, parsed.month, parsed.year],
  });

  return ok({ budgets: result.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const body = (await req.json().catch(() => null)) as
    | { amount?: number; category_id?: string; month?: number; year?: number }
    | null;

  const amount = parseMoney(body?.amount);
  const categoryId = cleanText(body?.category_id, 60) || null;
  const my = parseMonthYear(body?.month, body?.year);

  if (amount === null) return fail("Amount must be a non-negative number.");
  if (!my) return fail("Invalid month/year values.");

  if (categoryId) {
    const cat = await db.execute({
      sql: `SELECT id FROM categories WHERE id = ? AND user_id = ? LIMIT 1`,
      args: [categoryId, auth.userId],
    });
    if (!cat.rows.length) return fail("Invalid category.");
  }

  const existing = await db.execute({
    sql: `SELECT id FROM budgets
          WHERE user_id = ? AND month = ? AND year = ?
          AND ((category_id IS NULL AND ? IS NULL) OR category_id = ?)
          LIMIT 1`,
    args: [auth.userId, my.month, my.year, categoryId, categoryId],
  });

  if (existing.rows.length) {
    await db.execute({
      sql: `UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?`,
      args: [amount, existing.rows[0].id, auth.userId],
    });
    return ok({ id: existing.rows[0].id });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO budgets (id, user_id, category_id, amount, month, year, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, auth.userId, categoryId, amount, my.month, my.year, now],
  });

  return ok({ id }, 201);
}
