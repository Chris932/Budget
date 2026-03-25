import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, parseMoney, parseMonthYear } from "@/lib/validation";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { amount?: number; category_id?: string; month?: number; year?: number }
    | null;

  const amount = parseMoney(body?.amount);
  const categoryId = cleanText(body?.category_id, 60) || null;
  const my = parseMonthYear(body?.month, body?.year);

  if (amount === null) return fail("Amount must be a non-negative number.");
  if (!my) return fail("Invalid month/year values.");

  await db.execute({
    sql: `UPDATE budgets
          SET amount = ?, category_id = ?, month = ?, year = ?
          WHERE id = ? AND user_id = ?`,
    args: [amount, categoryId, my.month, my.year, id, auth.userId],
  });

  return ok({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;
  await db.execute({
    sql: `DELETE FROM budgets WHERE id = ? AND user_id = ?`,
    args: [id, auth.userId],
  });

  return ok({ success: true });
}
