import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText } from "@/lib/validation";
import { NextRequest } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = cleanText(body?.name, 80);
  if (!name) return fail("Category name is required.");

  await db.execute({
    sql: `UPDATE categories SET name = ? WHERE id = ? AND user_id = ?`,
    args: [name, id, auth.userId],
  });

  return ok({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const { id } = await params;

  await db.batch(
    [
      {
        sql: `UPDATE transactions SET category_id = NULL WHERE category_id = ? AND user_id = ?`,
        args: [id, auth.userId],
      },
      {
        sql: `UPDATE budgets SET category_id = NULL WHERE category_id = ? AND user_id = ?`,
        args: [id, auth.userId],
      },
      {
        sql: `DELETE FROM categories WHERE id = ? AND user_id = ?`,
        args: [id, auth.userId],
      },
    ],
    "write"
  );

  return ok({ success: true });
}
