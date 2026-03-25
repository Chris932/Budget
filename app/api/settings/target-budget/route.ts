import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { parseMoney } from "@/lib/validation";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const body = (await req.json().catch(() => null)) as { amount?: number } | null;
  const amount = parseMoney(body?.amount);
  if (amount === null) return fail("Amount must be a non-negative number.");

  await db.execute({
    sql: `UPDATE users SET monthly_target_budget = ? WHERE id = ?`,
    args: [amount, auth.userId],
  });

  return ok({ success: true });
}
