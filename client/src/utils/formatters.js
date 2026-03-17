// Format a number string with commas and up to 2 decimal places
// Input: "1234.5" → "1,234.50"  |  "1234" → "1,234"
export function formatMoney(value) {
  // Strip everything except digits and period
  let cleaned = value.replace(/[^0-9.]/g, '');

  // Only allow one period
  const parts = cleaned.split('.');
  if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');

  // Limit to 2 decimal places
  const [whole, decimal] = cleaned.split('.');
  const formattedWhole = whole ? parseInt(whole, 10).toLocaleString('en-US') : '';

  if (decimal !== undefined) {
    return formattedWhole + '.' + decimal.slice(0, 2);
  }
  return formattedWhole || '';
}

// Parse formatted money string back to a plain number
// Input: "1,234.56" → 1234.56
export function parseMoney(formatted) {
  const num = parseFloat(formatted.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}

// Format phone number as (123) 456-7890
export function formatPhone(value) {
  // Strip everything except digits
  const digits = value.replace(/\D/g, '').slice(0, 10);

  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
