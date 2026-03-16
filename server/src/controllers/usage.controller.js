import pool from '../config/db.js';
import { getUserPlan, FREE_LIMITS, PRO_LIMITS } from '../middleware/planGate.js';

export async function getUsage(req, res, next) {
  try {
    const plan = await getUserPlan(req.userId);

    const [txResult, scanResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM transactions
         WHERE user_id = $1 AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
        [req.userId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM transactions
         WHERE user_id = $1 AND receipt_path IS NOT NULL
         AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
        [req.userId]
      ),
    ]);

    const txCount = parseInt(txResult.rows[0].count);
    const scanCount = parseInt(scanResult.rows[0].count);

    const limits = plan === 'max'
      ? { transactions_per_month: null, receipt_scans_per_month: null }
      : plan === 'pro'
        ? PRO_LIMITS
        : FREE_LIMITS;

    res.json({
      plan,
      transactions: {
        used: txCount,
        limit: limits.transactions_per_month,
      },
      scans: {
        used: scanCount,
        limit: limits.receipt_scans_per_month,
      },
    });
  } catch (err) {
    next(err);
  }
}
