import pool from '../config/db.js';

export async function summary(req, res, next) {
  try {
    const { period = 'month', date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    let dateFilter;
    if (period === 'month') {
      dateFilter = `date_trunc('month', date) = $2`;
    } else if (period === 'quarter') {
      dateFilter = `date_trunc('quarter', date) = date_trunc('quarter', $2::date)`;
    } else {
      dateFilter = `date_trunc('year', date) = date_trunc('year', $2::date)`;
    }

    const dateParam = `${year}-${String(month).padStart(2, '0')}-01`;

    const result = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1 AND ${dateFilter}
       GROUP BY type`,
      [req.userId, dateParam]
    );

    const income = parseFloat(result.rows.find(r => r.type === 'income')?.total || 0);
    const expenses = parseFloat(result.rows.find(r => r.type === 'expense')?.total || 0);

    res.json({ income, expenses, profit: income - expenses, period, date: dateParam });
  } catch (err) {
    next(err);
  }
}

export async function chart(req, res, next) {
  try {
    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 60);

    const result = await pool.query(
      `SELECT date_trunc('month', date) as month, type, COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1 AND date >= NOW() - make_interval(months => $2)
       GROUP BY month, type
       ORDER BY month ASC`,
      [req.userId, months]
    );

    const chartData = {};
    for (const row of result.rows) {
      const key = new Date(row.month).toISOString().slice(0, 7);
      if (!chartData[key]) chartData[key] = { month: key, income: 0, expenses: 0 };
      if (row.type === 'income') chartData[key].income = parseFloat(row.total);
      else chartData[key].expenses = parseFloat(row.total);
    }

    res.json(Object.values(chartData));
  } catch (err) {
    next(err);
  }
}

export async function recent(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT 5`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
