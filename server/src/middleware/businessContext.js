import pool from '../config/db.js';

export default async function businessContext(req, res, next) {
  try {
    const businessId = req.headers['x-business-id'];

    if (businessId) {
      // Validate ownership
      const result = await pool.query(
        'SELECT id FROM businesses WHERE id = $1 AND user_id = $2',
        [businessId, req.userId]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Invalid business' });
      }
      req.businessId = businessId;
    } else {
      // Use default business
      const result = await pool.query(
        'SELECT default_business_id FROM users WHERE id = $1',
        [req.userId]
      );
      req.businessId = result.rows[0]?.default_business_id || null;
    }

    next();
  } catch (err) {
    next(err);
  }
}
