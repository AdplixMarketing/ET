import pool from '../config/db.js';

const FREE_LIMITS = {
  transactions_per_month: 15,
  receipt_scans_per_month: 5,
};

const PRO_LIMITS = {
  transactions_per_month: 200,
  receipt_scans_per_month: 80,
};

async function getUserPlan(userId) {
  const result = await pool.query(
    'SELECT plan, plan_expires_at FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return 'free';
  const user = result.rows[0];
  if ((user.plan === 'pro' || user.plan === 'max') && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
    return 'free'; // Expired
  }
  return user.plan;
}

async function getMonthlyCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM transactions
     WHERE user_id = $1 AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

async function getMonthlyScanCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM transactions
     WHERE user_id = $1 AND receipt_path IS NOT NULL
     AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
    [userId]
  );
  return parseInt(result.rows[0].count);
}

function getLimitsForPlan(plan) {
  if (plan === 'max') return { transactions_per_month: Infinity, receipt_scans_per_month: Infinity };
  if (plan === 'pro') return PRO_LIMITS;
  return FREE_LIMITS;
}

// Middleware: require Pro or Max plan
export function requirePro(req, res, next) {
  getUserPlan(req.userId).then((plan) => {
    if (plan !== 'pro' && plan !== 'max') {
      return res.status(403).json({
        error: 'Pro plan required',
        upgrade: true,
      });
    }
    req.userPlan = plan;
    next();
  }).catch(next);
}

// Middleware: require Max plan
export function requireMax(req, res, next) {
  getUserPlan(req.userId).then((plan) => {
    if (plan !== 'max') {
      return res.status(403).json({
        error: 'AddFi Max plan required',
        upgrade: true,
        requiredPlan: 'max',
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
    const limits = getLimitsForPlan(plan);
    if (limits.transactions_per_month === Infinity) return next();

    const count = await getMonthlyCount(req.userId);
    if (count >= limits.transactions_per_month) {
      const nextTier = plan === 'free' ? 'Pro' : 'Max';
      return res.status(403).json({
        error: `${plan === 'free' ? 'Free' : 'Pro'} plan limit: ${limits.transactions_per_month} transactions/month. Upgrade to ${nextTier} for ${plan === 'pro' ? 'unlimited' : 'more'}.`,
        upgrade: true,
        limit: limits.transactions_per_month,
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
    const limits = getLimitsForPlan(plan);
    if (limits.receipt_scans_per_month === Infinity) return next();

    const count = await getMonthlyScanCount(req.userId);
    if (count >= limits.receipt_scans_per_month) {
      const nextTier = plan === 'free' ? 'Pro' : 'Max';
      return res.status(403).json({
        error: `${plan === 'free' ? 'Free' : 'Pro'} plan limit: ${limits.receipt_scans_per_month} receipt scans/month. Upgrade to ${nextTier} for ${plan === 'pro' ? 'unlimited' : 'more'}.`,
        upgrade: true,
        limit: limits.receipt_scans_per_month,
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
    if (plan === 'pro' || plan === 'max') return next();
    return res.status(403).json({
      error: 'Custom categories require Pro plan.',
      upgrade: true,
    });
  }).catch(next);
}

export { getUserPlan, FREE_LIMITS, PRO_LIMITS };
