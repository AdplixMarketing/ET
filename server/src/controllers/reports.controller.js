import pool from '../config/db.js';
import { generatePDF } from '../services/report.service.js';

export async function pnl(req, res, next) {
  try {
    const { from, to, period = 'monthly' } = req.query;
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const defaultTo = now.toISOString().slice(0, 10);

    const dateFrom = from || defaultFrom;
    const dateTo = to || defaultTo;

    const result = await pool.query(
      `SELECT t.type, c.name as category, c.color,
              COALESCE(SUM(t.amount), 0) as total, COUNT(*) as count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
       GROUP BY t.type, c.name, c.color
       ORDER BY t.type, total DESC`,
      [req.userId, dateFrom, dateTo]
    );

    const income = result.rows.filter(r => r.type === 'income');
    const expenses = result.rows.filter(r => r.type === 'expense');
    const totalIncome = income.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.total), 0);

    res.json({
      period: { from: dateFrom, to: dateTo },
      income: { categories: income, total: totalIncome },
      expenses: { categories: expenses, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const { from, to, type } = req.query;
    let query = `
      SELECT t.type, t.amount, t.date, t.description, t.vendor_or_client,
             t.payment_method, t.notes, c.name as category
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (from) { query += ` AND t.date >= $${idx++}`; params.push(from); }
    if (to) { query += ` AND t.date <= $${idx++}`; params.push(to); }
    if (type) { query += ` AND t.type = $${idx++}`; params.push(type); }
    query += ' ORDER BY t.date DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No transactions found for export' });
    }

    const headers = ['Type', 'Amount', 'Date', 'Category', 'Description', 'Vendor/Client', 'Payment Method', 'Notes'];
    const csvRows = [headers.join(',')];
    for (const row of result.rows) {
      csvRows.push([
        row.type,
        row.amount,
        row.date,
        `"${(row.category || '').replace(/"/g, '""')}"`,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        `"${(row.vendor_or_client || '').replace(/"/g, '""')}"`,
        row.payment_method || '',
        `"${(row.notes || '').replace(/"/g, '""')}"`,
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    next(err);
  }
}

export async function exportPDF(req, res, next) {
  try {
    const { from, to } = req.query;
    const now = new Date();
    const dateFrom = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const dateTo = to || now.toISOString().slice(0, 10);

    const userResult = await pool.query('SELECT business_name, currency, business_address, business_phone FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const result = await pool.query(
      `SELECT t.type, c.name as category, COALESCE(SUM(t.amount), 0) as total, COUNT(*) as count
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.date >= $2 AND t.date <= $3
       GROUP BY t.type, c.name ORDER BY t.type, total DESC`,
      [req.userId, dateFrom, dateTo]
    );

    const income = result.rows.filter(r => r.type === 'income');
    const expenses = result.rows.filter(r => r.type === 'expense');
    const totalIncome = income.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.total), 0);

    const pdfBuffer = await generatePDF({
      businessName: user.business_name || 'My Business',
      businessAddress: user.business_address || '',
      currency: user.currency || 'USD',
      dateFrom,
      dateTo,
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=profit-loss-report.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// --- Max-only advanced reports ---

export async function cashFlow(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const result = await pool.query(
      `SELECT date_trunc('month', date) as month,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow
       FROM transactions WHERE user_id = $1
       AND date >= NOW() - INTERVAL '1 month' * $2
       GROUP BY date_trunc('month', date)
       ORDER BY month`,
      [req.userId, parseInt(months)]
    );

    const data = result.rows.map(r => {
      const d = new Date(r.month);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        inflow: parseFloat(r.inflow),
        outflow: parseFloat(r.outflow),
        net: parseFloat(r.inflow) - parseFloat(r.outflow),
      };
    });

    // Running balance
    let balance = 0;
    for (const row of data) {
      balance += row.net;
      row.balance = balance;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function taxSummary(req, res, next) {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT
        EXTRACT(QUARTER FROM date) as quarter,
        type,
        c.name as category,
        SUM(amount) as total,
        COUNT(*) as count
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND EXTRACT(YEAR FROM t.date) = $2
       GROUP BY EXTRACT(QUARTER FROM date), type, c.name
       ORDER BY quarter, type, total DESC`,
      [req.userId, targetYear]
    );

    const quarters = [1, 2, 3, 4].map(q => {
      const rows = result.rows.filter(r => parseInt(r.quarter) === q);
      const income = rows.filter(r => r.type === 'income').reduce((s, r) => s + parseFloat(r.total), 0);
      const expenses = rows.filter(r => r.type === 'expense').reduce((s, r) => s + parseFloat(r.total), 0);
      return {
        quarter: q,
        income,
        expenses,
        net: income - expenses,
        categories: rows,
      };
    });

    const totalIncome = quarters.reduce((s, q) => s + q.income, 0);
    const totalExpenses = quarters.reduce((s, q) => s + q.expenses, 0);

    res.json({
      year: targetYear,
      quarters,
      totals: { income: totalIncome, expenses: totalExpenses, net: totalIncome - totalExpenses },
    });
  } catch (err) {
    next(err);
  }
}

export async function expenseTrends(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const result = await pool.query(
      `SELECT date_trunc('month', t.date) as month,
              c.name as category, c.color,
              SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.type = 'expense'
       AND t.date >= NOW() - INTERVAL '1 month' * $2
       GROUP BY date_trunc('month', t.date), c.name, c.color
       ORDER BY month, total DESC`,
      [req.userId, parseInt(months)]
    );

    res.json(result.rows.map(r => ({
      month: r.month,
      category: r.category || 'Uncategorized',
      color: r.color || '#868E96',
      total: parseFloat(r.total),
    })));
  } catch (err) {
    next(err);
  }
}

export async function revenueByClient(req, res, next) {
  try {
    const { from, to } = req.query;
    let query = `
      SELECT i.client_name, i.client_id,
             SUM(i.total) as total_revenue,
             COUNT(*) as invoice_count,
             SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as paid_revenue
      FROM invoices i
      WHERE i.user_id = $1
    `;
    const params = [req.userId];
    let idx = 2;

    if (from) { query += ` AND i.issue_date >= $${idx++}`; params.push(from); }
    if (to) { query += ` AND i.issue_date <= $${idx++}`; params.push(to); }

    query += ' GROUP BY i.client_name, i.client_id ORDER BY total_revenue DESC';

    const result = await pool.query(query, params);
    res.json(result.rows.map(r => ({
      client_name: r.client_name,
      client_id: r.client_id,
      total_revenue: parseFloat(r.total_revenue),
      paid_revenue: parseFloat(r.paid_revenue),
      invoice_count: parseInt(r.invoice_count),
    })));
  } catch (err) {
    next(err);
  }
}

export async function forecast(req, res, next) {
  try {
    const { months = 3 } = req.query;
    const forecastMonths = Math.min(parseInt(months), 12);

    // Get last 6 months of data for trend calculation
    const result = await pool.query(
      `SELECT date_trunc('month', date) as month,
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as inflow,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as outflow
       FROM transactions WHERE user_id = $1
       AND date >= NOW() - INTERVAL '6 months'
       GROUP BY date_trunc('month', date)
       ORDER BY month`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ historical: [], forecast: [], summary: null });
    }

    const historical = result.rows.map(r => {
      const d = new Date(r.month);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        inflow: parseFloat(r.inflow),
        outflow: parseFloat(r.outflow),
        net: parseFloat(r.inflow) - parseFloat(r.outflow),
        type: 'actual',
      };
    });

    // Calculate averages and trends
    const avgInflow = historical.reduce((s, h) => s + h.inflow, 0) / historical.length;
    const avgOutflow = historical.reduce((s, h) => s + h.outflow, 0) / historical.length;

    // Simple linear trend (growth rate per month)
    let inflowTrend = 0;
    let outflowTrend = 0;
    if (historical.length >= 2) {
      inflowTrend = (historical[historical.length - 1].inflow - historical[0].inflow) / (historical.length - 1);
      outflowTrend = (historical[historical.length - 1].outflow - historical[0].outflow) / (historical.length - 1);
    }

    // Generate forecast
    const forecastData = [];
    const lastDate = new Date(result.rows[result.rows.length - 1].month);
    for (let i = 1; i <= forecastMonths; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      const projectedInflow = Math.max(0, avgInflow + inflowTrend * i);
      const projectedOutflow = Math.max(0, avgOutflow + outflowTrend * i);
      forecastData.push({
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        inflow: Math.round(projectedInflow * 100) / 100,
        outflow: Math.round(projectedOutflow * 100) / 100,
        net: Math.round((projectedInflow - projectedOutflow) * 100) / 100,
        type: 'forecast',
      });
    }

    // Running balance
    let balance = 0;
    for (const row of [...historical, ...forecastData]) {
      balance += row.net;
      row.balance = Math.round(balance * 100) / 100;
    }

    const totalForecastInflow = forecastData.reduce((s, f) => s + f.inflow, 0);
    const totalForecastOutflow = forecastData.reduce((s, f) => s + f.outflow, 0);

    res.json({
      historical,
      forecast: forecastData,
      summary: {
        avg_monthly_income: Math.round(avgInflow * 100) / 100,
        avg_monthly_expenses: Math.round(avgOutflow * 100) / 100,
        projected_income: Math.round(totalForecastInflow * 100) / 100,
        projected_expenses: Math.round(totalForecastOutflow * 100) / 100,
        projected_net: Math.round((totalForecastInflow - totalForecastOutflow) * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function periodComparison(req, res, next) {
  try {
    const { from1, to1, from2, to2 } = req.query;
    if (!from1 || !to1 || !from2 || !to2) {
      return res.status(400).json({ error: 'Both date ranges required (from1, to1, from2, to2)' });
    }

    const [p1Result, p2Result] = await Promise.all([
      pool.query(
        `SELECT type, SUM(amount) as total, COUNT(*) as count
         FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY type`,
        [req.userId, from1, to1]
      ),
      pool.query(
        `SELECT type, SUM(amount) as total, COUNT(*) as count
         FROM transactions WHERE user_id = $1 AND date >= $2 AND date <= $3
         GROUP BY type`,
        [req.userId, from2, to2]
      ),
    ]);

    const getSummary = (rows) => {
      const income = rows.find(r => r.type === 'income');
      const expenses = rows.find(r => r.type === 'expense');
      return {
        income: parseFloat(income?.total || 0),
        expenses: parseFloat(expenses?.total || 0),
        net: parseFloat(income?.total || 0) - parseFloat(expenses?.total || 0),
        transaction_count: parseInt(income?.count || 0) + parseInt(expenses?.count || 0),
      };
    };

    res.json({
      period1: { from: from1, to: to1, ...getSummary(p1Result.rows) },
      period2: { from: from2, to: to2, ...getSummary(p2Result.rows) },
    });
  } catch (err) {
    next(err);
  }
}
