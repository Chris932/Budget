import { requireApiUser } from "@/lib/auth";
import { getReportData } from "@/lib/data";
import { fail, ok } from "@/lib/http";
import { parseMonthYear } from "@/lib/validation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req);
  if (!auth) return fail("Unauthorized", 401);

  const now = new Date();
  const search = req.nextUrl.searchParams;
  const parsed = parseMonthYear(
    search.get("month") ?? now.getMonth() + 1,
    search.get("year") ?? now.getFullYear()
  );

  if (!parsed) return fail("Invalid month/year values.");
  const data = await getReportData(auth.userId, parsed.month, parsed.year);
  return ok(data);
}
