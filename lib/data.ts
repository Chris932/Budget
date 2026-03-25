import { db, initDb } from "./db";

function asNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getDashboardData(userId: string) {
  await initDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const [balanceQ, monthQ, targetQ, recentQ, budgetQ] = await Promise.all([
    db.execute({
      sql: `SELECT
            COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as balance
            FROM transactions WHERE user_id = ?`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT
            COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND substr(date,1,7) = ?`,
      args: [userId, monthPrefix],
    }),
    db.execute({
      sql: `SELECT monthly_target_budget FROM users WHERE id = ? LIMIT 1`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT t.id, t.amount, t.type, t.date, t.description, c.name as category_name
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE t.user_id = ?
            ORDER BY t.date DESC, t.created_at DESC
            LIMIT 8`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT b.id, b.amount, b.category_id, c.name as category_name,
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.user_id = b.user_id
                AND t.type = 'expense'
                AND (b.category_id IS NULL OR t.category_id = b.category_id)
                AND substr(t.date,1,7) = ?
            ), 0) as spent
            FROM budgets b
            LEFT JOIN categories c ON c.id = b.category_id
            WHERE b.user_id = ? AND b.month = ? AND b.year = ?
            ORDER BY c.name IS NULL, c.name`,
      args: [monthPrefix, userId, month, year],
    }),
  ]);

  const balance = asNumber(balanceQ.rows[0]?.balance);
  const incomeMonth = asNumber(monthQ.rows[0]?.income);
  const expensesMonth = asNumber(monthQ.rows[0]?.expense);
  const monthlyTarget = asNumber(targetQ.rows[0]?.monthly_target_budget);

  const spendByCategory = await db.execute({
    sql: `SELECT c.name as category_name, COALESCE(SUM(t.amount),0) as spent
          FROM transactions t
          LEFT JOIN categories c ON c.id = t.category_id
          WHERE t.user_id = ?
            AND t.type = 'expense'
            AND substr(t.date,1,7) = ?
          GROUP BY c.name
          ORDER BY spent DESC
          LIMIT 1`,
    args: [userId, monthPrefix],
  });

  const trend = await db.execute({
    sql: `SELECT substr(date,1,7) as month,
          COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) as income,
          COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) as expense
          FROM transactions
          WHERE user_id = ?
          GROUP BY substr(date,1,7)
          ORDER BY month DESC
          LIMIT 6`,
    args: [userId],
  });

  return {
    summary: {
      balance,
      incomeMonth,
      expensesMonth,
      remainingBudget: monthlyTarget - expensesMonth,
      topSpendingCategory:
        (spendByCategory.rows[0]?.category_name as string | null) ?? "N/A",
      overBudget: monthlyTarget > 0 && expensesMonth > monthlyTarget,
    },
    trend: trend.rows,
    recentTransactions: recentQ.rows,
    budgetProgress: budgetQ.rows,
  };
}

export async function getReportData(userId: string, month: number, year: number) {
  await initDb();
  const currentPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const prev = new Date(year, month - 2, 1);
  const prevPrefix = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const [summary, categories, budgetUsage, previous] = await Promise.all([
    db.execute({
      sql: `SELECT
            COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND substr(date,1,7) = ?`,
      args: [userId, currentPrefix],
    }),
    db.execute({
      sql: `SELECT COALESCE(c.name, 'Uncategorized') as category,
            COALESCE(SUM(t.amount), 0) as amount
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE t.user_id = ?
              AND t.type = 'expense'
              AND substr(t.date,1,7) = ?
            GROUP BY c.name
            ORDER BY amount DESC`,
      args: [userId, currentPrefix],
    }),
    db.execute({
      sql: `SELECT COALESCE(c.name, 'Overall') as budget_name,
            b.amount as budget_amount,
            COALESCE((
              SELECT SUM(t.amount)
              FROM transactions t
              WHERE t.user_id = b.user_id
                AND t.type = 'expense'
                AND (b.category_id IS NULL OR t.category_id = b.category_id)
                AND substr(t.date,1,7) = ?
            ), 0) as spent
            FROM budgets b
            LEFT JOIN categories c ON c.id = b.category_id
            WHERE b.user_id = ? AND b.month = ? AND b.year = ?
            ORDER BY budget_name`,
      args: [currentPrefix, userId, month, year],
    }),
    db.execute({
      sql: `SELECT
            COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
            COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = ? AND substr(date,1,7) = ?`,
      args: [userId, prevPrefix],
    }),
  ]);

  return {
    month,
    year,
    summary: summary.rows[0],
    previous: previous.rows[0],
    categoryBreakdown: categories.rows,
    budgetUsage: budgetUsage.rows,
  };
}
