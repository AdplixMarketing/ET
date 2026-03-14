import { scanReceipt } from '../services/ocr.service.js';
import pool from '../config/db.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { uploadToR2 } from '../services/r2.service.js';

export async function scan(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // OCR reads the local file first (before we delete it)
    const ocrResult = await scanReceipt(req.file.path);

    // Compress and upload to R2
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    let filePath = req.file.path;
    let contentType = req.file.mimetype;
    let filename = req.file.filename;

    if (isImage) {
      const outputPath = req.file.path.replace(/\.[^.]+$/, '.webp');
      await sharp(req.file.path)
        .resize(1200, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80 })
        .toFile(outputPath);
      await fs.unlink(req.file.path);
      filePath = outputPath;
      contentType = 'image/webp';
      filename = path.basename(outputPath);
    }

    const key = `${req.userId}/${filename}`;
    await uploadToR2(filePath, key, contentType);
    await fs.unlink(filePath);

    // Suggest category
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
      receipt_path: key,
    });
  } catch (err) {
    next(err);
  }
}
