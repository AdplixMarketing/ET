/**
 * Parse a CSV buffer into headers and rows.
 * Handles quoted fields containing commas and newlines.
 */
export function parseCSV(buffer) {
  const text = buffer.toString('utf-8').trim();
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = [];

  // Split into lines respecting quoted fields
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) && !inQuotes) {
      lines.push(current);
      current = '';
      if (ch === '\r') i++; // skip \n in \r\n
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse a single CSV line into fields
  function parseLine(line) {
    const fields = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === ',' && !quoted) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    rows.push(parseLine(lines[i]));
  }

  return { headers, rows };
}

/**
 * Parse a QBO/OFX XML buffer into an array of transaction objects.
 * Uses simple regex-based extraction since no XML parser is available.
 */
export function parseQBO(buffer) {
  const text = buffer.toString('utf-8');
  const transactions = [];

  // Match each STMTTRN block
  const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = txnRegex.exec(text)) !== null) {
    const block = match[1];

    const getTag = (tag) => {
      // OFX can be <TAG>value\n or <TAG>value</TAG>
      const re = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
      const m = block.match(re);
      return m ? m[1].trim() : null;
    };

    const trnType = getTag('TRNTYPE');
    const dtPosted = getTag('DTPOSTED');
    const amount = getTag('TRNAMT');
    const name = getTag('NAME');
    const memo = getTag('MEMO');
    const fitId = getTag('FITID');

    // Parse OFX date format YYYYMMDD or YYYYMMDDHHMMSS
    let date = null;
    if (dtPosted && dtPosted.length >= 8) {
      date = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
    }

    transactions.push({
      type: amount && parseFloat(amount) < 0 ? 'expense' : 'income',
      amount: amount ? Math.abs(parseFloat(amount)) : 0,
      date,
      description: name || memo || '',
      vendor_or_client: name || '',
      notes: memo || '',
      reference: fitId || null,
      original_type: trnType,
    });
  }

  return transactions;
}

/**
 * Apply column mapping to parsed CSV rows.
 * mapping is an object like { date: 0, amount: 2, description: 1, ... }
 * where values are column indices.
 */
export function applyMapping(rows, mapping) {
  return rows.map((row) => {
    const txn = {};
    for (const [field, colIndex] of Object.entries(mapping)) {
      if (colIndex !== null && colIndex !== undefined && colIndex < row.length) {
        txn[field] = row[colIndex];
      }
    }

    // Normalize amount
    if (txn.amount) {
      const raw = String(txn.amount).replace(/[^0-9.\-]/g, '');
      txn.amount = Math.abs(parseFloat(raw)) || 0;
    }

    // Infer type from amount sign if not mapped
    if (!txn.type) {
      const rawAmount = mapping.amount !== undefined ? row[mapping.amount] : '';
      txn.type = String(rawAmount).trim().startsWith('-') ? 'expense' : 'income';
    }

    return txn;
  });
}
