import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { AUTH_COOKIE } from "./constants";
import { db, initDb } from "./db";
import { User } from "./models";

const JWT_SECRET = process.env.JWT_SECRET || "budgettrack-dev-secret-change-me";

type AuthToken = {
  sub: string;
  email: string;
};

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createAuthToken(payload: AuthToken) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as AuthToken;
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

export function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  await initDb();
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = verifyAuthToken(token);
    const user = await db.execute({
      sql: `SELECT id, email, name, monthly_target_budget, created_at
            FROM users WHERE id = ? LIMIT 1`,
      args: [payload.sub],
    });

    if (!user.rows.length) return null;
    return user.rows[0] as unknown as User;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser(req: NextRequest) {
  await initDb();
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const payload = verifyAuthToken(token);
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
