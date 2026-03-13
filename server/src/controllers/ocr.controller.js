import { scanReceipt } from '../services/ocr.service.js';
import pool from '../config/db.js';

export async function scan(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const ocrResult = await scanReceipt(req.file.path);

    // Try to suggest a category based on vendor name
    let suggestedCategory = null;
    if (ocrResult.vendor) {
      const catResult = await pool.query(
        `SELECT c.id, c.name FROM categories c
         JOIN transactions t ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.vendor_or_client ILIKE $2 AND t.type = 'expense'
         GROUP BY c.id, c.name
         ORDER BY COUNT(*) DESC LIMIT 1`,
        [req.userId, `%${ocrResult.vendor}%`]
      );
      if (catResult.rows.length > 0) {
        suggestedCategory = catResult.rows[0];
      }
    }

    res.json({
      vendor: ocrResult.vendor,
      date: ocrResult.date,
      amount: ocrResult.amount,
      suggested_category: suggestedCategory,
      raw_text: ocrResult.rawText,
      receipt_path: req.file.path,
    });
  } catch (err) {
    next(err);
  }
}
