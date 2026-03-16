import pool from '../config/db.js';

export async function runAutoCategorize(userId, transaction) {
  try {
    const rules = await pool.query(
      `SELECT * FROM automation_rules
       WHERE user_id = $1 AND rule_type = 'auto_categorize' AND is_active = TRUE`,
      [userId]
    );

    for (const rule of rules.rows) {
      const fieldValue = (transaction[rule.match_field] || '').toLowerCase();
      const matchValue = rule.match_value.toLowerCase();
      let matched = false;

      switch (rule.match_type) {
        case 'exact':
          matched = fieldValue === matchValue;
          break;
        case 'starts_with':
          matched = fieldValue.startsWith(matchValue);
          break;
        case 'contains':
        default:
          matched = fieldValue.includes(matchValue);
          break;
      }

      if (matched && rule.category_id) {
        return rule.category_id;
      }
    }

    return null;
  } catch (err) {
    console.error('Auto-categorize failed:', err.message);
    return null;
  }
}

export async function checkDuplicate(userId, transaction) {
  try {
    // Check for potential duplicates: same amount, same date, same vendor within last 7 days
    const result = await pool.query(
      `SELECT id, amount, date, vendor_or_client, description
       FROM transactions
       WHERE user_id = $1 AND amount = $2 AND date = $3
       AND vendor_or_client = $4
       AND created_at > NOW() - INTERVAL '7 days'
       LIMIT 3`,
      [userId, transaction.amount, transaction.date, transaction.vendor_or_client]
    );

    return result.rows;
  } catch (err) {
    console.error('Duplicate check failed:', err.message);
    return [];
  }
}
