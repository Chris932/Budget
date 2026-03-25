import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText } from "@/lib/validation";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);

  await initDb();
  const result = await db.execute({
    sql: `SELECT id, user_id, name, created_at
          FROM categories
          WHERE user_id = ?
          ORDER BY name ASC`,
    args: [auth.userId],
  });

  return ok({ categories: result.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);

  await initDb();
  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = cleanText(body?.name, 80);
  if (!name) return fail("Category name is required.");

  const id = randomUUID();
  const now = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO categories (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`,
      args: [id, auth.userId, name, now],
    });
    return ok({ id, name }, 201);
  } catch {
    return fail("Category already exists.", 409);
  }
}
