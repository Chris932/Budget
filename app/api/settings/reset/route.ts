import { requireApiUser } from "@/lib/auth";
import { db, seedDefaultCategories } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);

  await db.batch(
    [
      { sql: `DELETE FROM transactions WHERE user_id = ?`, args: [auth.userId] },
      { sql: `DELETE FROM budgets WHERE user_id = ?`, args: [auth.userId] },
      { sql: `DELETE FROM categories WHERE user_id = ?`, args: [auth.userId] },
    ],
    "write"
  );

  await seedDefaultCategories(auth.userId);

  return ok({ success: true });
}
