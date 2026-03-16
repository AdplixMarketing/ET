import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../migrations');

async function migrate() {
  try {
    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already-run migrations
    const executed = await pool.query('SELECT filename FROM _migrations ORDER BY filename');
    const executedSet = new Set(executed.rows.map(r => r.filename));

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let ranCount = 0;
    for (const file of files) {
      if (executedSet.has(file)) {
        console.log(`Skipping (already run): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      console.log(`Running migration: ${file}`);
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      ranCount++;
    }

    console.log(ranCount > 0
      ? `${ranCount} migration(s) completed.`
      : 'All migrations already up to date.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
