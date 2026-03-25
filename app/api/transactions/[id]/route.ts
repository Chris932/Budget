import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, parseMoney, parseTransactionType } from "@/lib/validation";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;
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

  await db.execute({
    sql: `UPDATE transactions
          SET amount = ?, type = ?, category_id = ?, date = ?, description = ?
          WHERE id = ? AND user_id = ?`,
    args: [amount, type, categoryId, date, description, id, auth.userId],
  });

  return ok({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;

  await db.execute({
    sql: `DELETE FROM transactions WHERE id = ? AND user_id = ?`,
    args: [id, auth.userId],
  });

  return ok({ success: true });
}
