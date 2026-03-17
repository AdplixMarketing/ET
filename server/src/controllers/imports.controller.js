import multer from 'multer';
import pool from '../config/db.js';
import { parseCSV, parseQBO, applyMapping } from '../services/import.service.js';

const uploadMiddleware = multer({ storage: multer.memoryStorage() });

export const uploadFile = uploadMiddleware.single('file');

export async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = req.file.originalname;
    const ext = filename.split('.').pop().toLowerCase();

    let file_type;
    if (ext === 'csv') file_type = 'csv';
    else if (ext === 'qbo' || ext === 'ofx') file_type = 'qbo';
    else return res.status(400).json({ error: 'Unsupported file type. Upload CSV or QBO/OFX files.' });

    let headers = [];
    let totalRows = 0;

    if (file_type === 'csv') {
      const parsed = parseCSV(req.file.buffer);
      headers = parsed.headers;
      totalRows = parsed.rows.length;
    } else {
      const transactions = parseQBO(req.file.buffer);
      headers = ['type', 'amount', 'date', 'description', 'vendor_or_client', 'notes'];
      totalRows = transactions.length;
    }

    const result = await pool.query(
      `INSERT INTO import_jobs (user_id, filename, file_type, status, total_rows)
       VALUES ($1, $2, $3, 'mapping', $4)
       RETURNING *`,
      [req.userId, filename, file_type, totalRows]
    );

    res.status(201).json({
      job: result.rows[0],
      headers,
      totalRows,
    });
  } catch (err) {
    next(err);
  }
}

export async function setMapping(req, res, next) {
  try {
    const { mapping } = req.body;
    if (!mapping) return res.status(400).json({ error: 'mapping is required' });

    const result = await pool.query(
      `UPDATE import_jobs SET column_mapping = $3, status = 'preview', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.userId, JSON.stringify(mapping)]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Import job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function preview(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM import_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Import job not found' });

    const job = result.rows[0];
    if (!job.column_mapping) return res.status(400).json({ error: 'Column mapping not set. Set mapping first.' });

    // We need the original file to preview - since we use memory storage,
    // the file is not persisted. For preview, return the mapping info.
    // In a production setup, the file would be stored in R2/S3.
    res.json({
      job,
      message: 'Preview is based on the mapping configuration. Re-upload and execute to import.',
      mapping: job.column_mapping,
    });
  } catch (err) {
    next(err);
  }
}

export async function execute(req, res, next) {
  try {
    const jobResult = await pool.query(
      'SELECT * FROM import_jobs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (jobResult.rows.length === 0) return res.status(404).json({ error: 'Import job not found' });

    const job = jobResult.rows[0];
    if (!job.column_mapping) return res.status(400).json({ error: 'Column mapping not set' });

    if (!req.file) return res.status(400).json({ error: 'File must be re-uploaded for execution' });

    await pool.query(
      `UPDATE import_jobs SET status = 'importing', updated_at = NOW() WHERE id = $1`,
      [job.id]
    );

    let rows = [];
    if (job.file_type === 'csv') {
      const parsed = parseCSV(req.file.buffer);
      rows = applyMapping(parsed.rows, job.column_mapping);
    } else {
      rows = parseQBO(req.file.buffer);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Batch insert in chunks of 50 for performance
    const BATCH_SIZE = 50;
    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const chunk = rows.slice(batch, batch + BATCH_SIZE);
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (let i = 0; i < chunk.length; i++) {
        const txn = chunk[i];
        try {
          const amt = parseFloat(txn.amount) || 0;
          const date = txn.date || new Date().toISOString().split('T')[0];
          if (amt === 0) {
            skippedCount++;
            errors.push({ row: batch + i + 1, error: 'Invalid amount' });
            continue;
          }
          values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
          params.push(req.userId, txn.type || 'expense', amt, date, txn.description || '', txn.vendor_or_client || null, txn.notes || null);
        } catch (err) {
          skippedCount++;
          errors.push({ row: batch + i + 1, error: err.message });
        }
      }

      if (values.length > 0) {
        try {
          const result = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, date, description, vendor_or_client, notes)
             VALUES ${values.join(', ')}`,
            params
          );
          importedCount += result.rowCount;
        } catch (err) {
          // Fall back to individual inserts for this batch to identify bad rows
          for (let i = 0; i < chunk.length; i++) {
            const txn = chunk[i];
            try {
              await pool.query(
                `INSERT INTO transactions (user_id, type, amount, date, description, vendor_or_client, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [req.userId, txn.type || 'expense', parseFloat(txn.amount) || 0, txn.date || new Date().toISOString().split('T')[0], txn.description || '', txn.vendor_or_client || null, txn.notes || null]
              );
              importedCount++;
            } catch (rowErr) {
              skippedCount++;
              errors.push({ row: batch + i + 1, error: rowErr.message });
            }
          }
        }
      }
    }

    await pool.query(
      `UPDATE import_jobs
       SET status = 'completed', imported_count = $2, skipped_count = $3, errors = $4, updated_at = NOW()
       WHERE id = $1`,
      [job.id, importedCount, skippedCount, JSON.stringify(errors)]
    );

    res.json({
      status: 'completed',
      imported_count: importedCount,
      skipped_count: skippedCount,
      errors,
    });
  } catch (err) {
    await pool.query(
      `UPDATE import_jobs SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    ).catch(() => {});
    next(err);
  }
}

/**
 * POST /imports/parse
 * Accepts a file upload (CSV or QBO), parses it, and returns { columns, rows }
 * directly without creating a job. Rows are objects keyed by column name.
 */
export async function parse(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filename = req.file.originalname;
    const ext = filename.split('.').pop().toLowerCase();

    if (ext === 'csv') {
      const parsed = parseCSV(req.file.buffer);
      // Convert array rows into objects keyed by header name
      const rows = parsed.rows.map((row) => {
        const obj = {};
        parsed.headers.forEach((h, i) => {
          obj[h] = i < row.length ? row[i] : '';
        });
        return obj;
      });
      return res.json({ columns: parsed.headers, rows });
    }

    if (ext === 'qbo' || ext === 'ofx') {
      const transactions = parseQBO(req.file.buffer);
      const columns = ['type', 'amount', 'date', 'description', 'vendor_or_client', 'notes'];
      const rows = transactions.map((txn) => {
        const obj = {};
        columns.forEach((col) => { obj[col] = txn[col] ?? ''; });
        return obj;
      });
      return res.json({ columns, rows });
    }

    return res.status(400).json({ error: 'Unsupported file type. Upload CSV or QBO/OFX files.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /imports/execute
 * Accepts JSON body { rows, mapping, filename }.
 * - rows: array of objects (keyed by original column names)
 * - mapping: object mapping original column name -> transaction field name
 * - filename: original filename for the history record
 * Applies mapping, batch-inserts transactions, creates an import_jobs record,
 * and returns { imported, skipped, errors }.
 */
export async function executeDirectly(req, res, next) {
  try {
    const { rows: rawRows, mapping: colMapping, filename } = req.body;
    if (!rawRows || !Array.isArray(rawRows)) return res.status(400).json({ error: 'rows is required and must be an array' });
    if (!colMapping || typeof colMapping !== 'object') return res.status(400).json({ error: 'mapping is required' });

    // Apply mapping: colMapping maps original_column_name -> transaction_field_name
    // Convert each row object into a transaction object using the mapping
    const mappedRows = rawRows.map((row) => {
      const txn = {};
      for (const [originalCol, fieldName] of Object.entries(colMapping)) {
        if (fieldName && row[originalCol] !== undefined) {
          txn[fieldName] = row[originalCol];
        }
      }

      // Normalize amount
      if (txn.amount) {
        const raw = String(txn.amount).replace(/[^0-9.\-]/g, '');
        txn.amount = Math.abs(parseFloat(raw)) || 0;
      }

      // Infer type from original amount sign if not mapped
      if (!txn.type) {
        // Find the original column mapped to 'amount'
        const amountCol = Object.entries(colMapping).find(([, v]) => v === 'amount');
        const rawAmount = amountCol ? row[amountCol[0]] : '';
        txn.type = String(rawAmount).trim().startsWith('-') ? 'expense' : 'income';
      }

      return txn;
    });

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const BATCH_SIZE = 50;
    for (let batch = 0; batch < mappedRows.length; batch += BATCH_SIZE) {
      const chunk = mappedRows.slice(batch, batch + BATCH_SIZE);
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (let i = 0; i < chunk.length; i++) {
        const txn = chunk[i];
        try {
          const amt = parseFloat(txn.amount) || 0;
          const date = txn.date || new Date().toISOString().split('T')[0];
          if (amt === 0) {
            skippedCount++;
            errors.push({ row: batch + i + 1, error: 'Invalid amount' });
            continue;
          }
          values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
          params.push(req.userId, txn.type || 'expense', amt, date, txn.description || '', txn.vendor_or_client || null, txn.notes || null);
        } catch (err) {
          skippedCount++;
          errors.push({ row: batch + i + 1, error: err.message });
        }
      }

      if (values.length > 0) {
        try {
          const result = await pool.query(
            `INSERT INTO transactions (user_id, type, amount, date, description, vendor_or_client, notes)
             VALUES ${values.join(', ')}`,
            params
          );
          importedCount += result.rowCount;
        } catch (err) {
          for (let i = 0; i < chunk.length; i++) {
            const txn = chunk[i];
            try {
              await pool.query(
                `INSERT INTO transactions (user_id, type, amount, date, description, vendor_or_client, notes)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [req.userId, txn.type || 'expense', parseFloat(txn.amount) || 0, txn.date || new Date().toISOString().split('T')[0], txn.description || '', txn.vendor_or_client || null, txn.notes || null]
              );
              importedCount++;
            } catch (rowErr) {
              skippedCount++;
              errors.push({ row: batch + i + 1, error: rowErr.message });
            }
          }
        }
      }
    }

    // Create a history record
    const ext = (filename || '').split('.').pop().toLowerCase();
    const fileType = (ext === 'qbo' || ext === 'ofx') ? 'qbo' : 'csv';
    await pool.query(
      `INSERT INTO import_jobs (user_id, filename, file_type, status, total_rows, imported_count, skipped_count, errors)
       VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7)`,
      [req.userId, filename || 'unknown', fileType, rawRows.length, importedCount, skippedCount, JSON.stringify(errors)]
    );

    res.json({
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function history(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM import_jobs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}
