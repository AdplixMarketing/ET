import pool from '../config/db.js';

const FREE_LIMITS = {
  transactions_per_month: 15,
  receipt_scans_per_month: 5,
};

async function getUserPlan(userId) {
  const result = await pool.query(
    'SELECT plan, plan_expires_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return 'free';
  const user = result.rows[0];
  if (user.plan === 'pro' && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    return 'free'; // Expired
  }
  return user.plan;
}

async function getMonthlyCount(userId, type) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM transactions
     WHERE user_id = $1 AND date_trunc('month', created_at) = date_trunc('month', NOW())
     ${type ? "AND type = 'receipt_scan'" : ''}`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

// Middleware: require Pro plan
export function requirePro(req, res, next) {
  getUserPlan(req.userId).then((plan) => {
    if (plan !== 'pro') {
      return res.status(403).json({
        error: 'Pro plan required',
        upgrade: true,
      });
    }
    req.userPlan = plan;
    next();
  }).catch(next);
}

// Middleware: check transaction limit
export function checkTransactionLimit(req, res, next) {
  getUserPlan(req.userId).then(async (plan) => {
    req.userPlan = plan;
    if (plan === 'pro') return next();

    const count = await getMonthlyCount(req.userId);
    if (count >= FREE_LIMITS.transactions_per_month) {
      return res.status(403).json({
        error: `Free plan limit: ${FREE_LIMITS.transactions_per_month} transactions/month. Upgrade to Pro for unlimited.`,
        upgrade: true,
        limit: FREE_LIMITS.transactions_per_month,
        used: count,
      });
    }
    next();
  }).catch(next);
}

// Middleware: check receipt scan limit
export function checkScanLimit(req, res, next) {
  getUserPlan(req.userId).then(async (plan) => {
    req.userPlan = plan;
    if (plan === 'pro') return next();

    // Count scans this month (transactions with receipt_path set)
    const result = await pool.query(
      `SELECT COUNT(*) FROM transactions
       WHERE user_id = $1 AND receipt_path IS NOT NULL
       AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
      [req.userId]
    );
    const count = parseInt(result.rows[0].count);

    if (count >= FREE_LIMITS.receipt_scans_per_month) {
      return res.status(403).json({
        error: `Free plan limit: ${FREE_LIMITS.receipt_scans_per_month} receipt scans/month. Upgrade to Pro for unlimited.`,
        upgrade: true,
        limit: FREE_LIMITS.receipt_scans_per_month,
        used: count,
      });
    }
    next();
  }).catch(next);
}

// Middleware: check custom category (free = defaults only)
export function checkCategoryLimit(req, res, next) {
  getUserPlan(req.userId).then((plan) => {
    req.userPlan = plan;
    if (plan === 'pro') return next();
    return res.status(403).json({
      error: 'Custom categories require Pro plan.',
      upgrade: true,
    });
  }).catch(next);
}

export { getUserPlan, FREE_LIMITS };
