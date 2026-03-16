import pool from '../config/db.js';

export async function auditLog(userId, action, { entityType, entityId, metadata, req } = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        req?.ip || null,
        req?.headers?.['user-agent'] || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('Audit log failed:', err.message);
  }
}
