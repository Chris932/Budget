import { createAuthToken, hashPassword, setAuthCookie } from "@/lib/auth";
import { db, initDb, seedDefaultCategories } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { cleanText, isEmail } from "@/lib/validation";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  await initDb();
  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string; name?: string }
    | null;

  if (!body) return fail("Invalid request body.");

  const email = cleanText(body.email, 160).toLowerCase();
  const password = String(body.password ?? "");
  const name = cleanText(body.name, 80) || null;

  if (!isEmail(email)) return fail("Please provide a valid email.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const existing = await db.execute({
    sql: `SELECT id FROM users WHERE email = ? LIMIT 1`,
    args: [email],
  });

  if (existing.rows.length) return fail("Email is already registered.", 409);

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, monthly_target_budget, created_at)
          VALUES (?, ?, ?, ?, 0, ?)`,
    args: [id, email, passwordHash, name, createdAt],
  });

  await seedDefaultCategories(id);

  const token = createAuthToken({ sub: id, email });
  await setAuthCookie(token);

  return ok({ id, email, name }, 201);
}
