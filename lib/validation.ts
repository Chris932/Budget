import { TransactionType } from "./models";

export function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseMoney(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function parseTransactionType(value: unknown): TransactionType | null {
  if (value === "income" || value === "expense") return value;
  return null;
}

export function parseMonthYear(month: unknown, year: unknown) {
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) return null;
  if (!Number.isInteger(y) || y < 1970 || y > 3000) return null;
  return { month: m, year: y };
}

export function cleanText(value: unknown, maxLen = 255) {
  const text = String(value ?? "").trim();
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}
