import { createAuthToken, setAuthCookie, verifyPassword } from "@/lib/auth";
import { db, initDb } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, isEmail } from "@/lib/validation";

export async function POST(req: Request) {
  await initDb();
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;

  if (!body) return fail("Invalid request body.");

  const email = cleanText(body.email, 160).toLowerCase();
  const password = String(body.password ?? "");

  if (!isEmail(email) || !password) return fail("Invalid credentials.", 401);

  const result = await db.execute({
    sql: `SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1`,
    args: [email],
  });

  const row = result.rows[0];
  if (!row) return fail("Invalid credentials.", 401);

  const valid = await verifyPassword(password, String(row.password_hash));
  if (!valid) return fail("Invalid credentials.", 401);

  const token = createAuthToken({ sub: String(row.id), email: String(row.email) });
  await setAuthCookie(token);

  return ok({ id: row.id, email: row.email });
}
