import { requireApiUser } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, isEmail } from "@/lib/validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const result = await db.execute({
    sql: `SELECT email, name, monthly_target_budget FROM users WHERE id = ? LIMIT 1`,
    args: [auth.userId],
  });

  if (!result.rows.length) return fail("User not found.", 404);
  return ok(result.rows[0]);
}

export async function PUT(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);
  await initDb();

  const body = (await req.json().catch(() => null)) as
    | { email?: string; name?: string }
    | null;
  if (!body) return fail("Invalid request body.");

  const email = cleanText(body.email, 160).toLowerCase();
  const name = cleanText(body.name, 80) || null;

  if (!isEmail(email)) return fail("Invalid email.");

  try {
    await db.execute({
      sql: `UPDATE users SET email = ?, name = ? WHERE id = ?`,
      args: [email, name, auth.userId],
    });
    return ok({ success: true });
  } catch {
    return fail("Email already in use.", 409);
  }
}
