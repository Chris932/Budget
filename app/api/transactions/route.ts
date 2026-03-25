import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, parseMoney, parseTransactionType } from "@/lib/validation";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const search = req.nextUrl.searchParams;
  const startDate = cleanText(search.get("startDate"), 20);
  const endDate = cleanText(search.get("endDate"), 20);
  const type = parseTransactionType(search.get("type"));
  const categoryId = cleanText(search.get("categoryId"), 60);
  const sort = cleanText(search.get("sort"), 20);

  let sql = `SELECT t.id, t.user_id, t.amount, t.type, t.category_id, t.date, t.description, t.created_at,
                    c.name as category_name
             FROM transactions t
             LEFT JOIN categories c ON c.id = t.category_id
             WHERE t.user_id = ?`;
  const args: Array<string | number> = [auth.userId];

  if (startDate) {
    sql += ` AND t.date >= ?`;
    args.push(startDate);
  }
  if (endDate) {
    sql += ` AND t.date <= ?`;
    args.push(endDate);
  }
  if (type) {
    sql += ` AND t.type = ?`;
    args.push(type);
  }
  if (categoryId) {
    sql += ` AND t.category_id = ?`;
    args.push(categoryId);
  }

  if (sort === "oldest") sql += ` ORDER BY t.date ASC, t.created_at ASC`;
  else if (sort === "highest") sql += ` ORDER BY t.amount DESC`;
  else if (sort === "lowest") sql += ` ORDER BY t.amount ASC`;
  else sql += ` ORDER BY t.date DESC, t.created_at DESC`;

  const result = await db.execute({ sql, args });
  return ok({ transactions: result.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const body = (await req.json().catch(() => null)) as
    | { amount?: number; type?: string; category_id?: string; date?: string; description?: string }
    | null;

  const amount = parseMoney(body?.amount);
  const type = parseTransactionType(body?.type);
  const categoryId = cleanText(body?.category_id, 60) || null;
  const date = cleanText(body?.date, 20);
  const description = cleanText(body?.description, 180) || null;

  if (amount === null) return fail("Amount must be a non-negative number.");
  if (!type) return fail("Invalid transaction type.");
  if (!date) return fail("Date is required.");

  if (categoryId) {
    const cat = await db.execute({
      sql: `SELECT id FROM categories WHERE id = ? AND user_id = ? LIMIT 1`,
      args: [categoryId, auth.userId],
    });
    if (!cat.rows.length) return fail("Invalid category.");
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO transactions (id, user_id, category_id, amount, type, date, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, auth.userId, categoryId, amount, type, date, description, now],
  });

  return ok({ id }, 201);
}
