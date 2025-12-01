// lib/execute/errors.ts

export interface ColumnNotFoundInfo { missingColumns: string[] }
export interface AmbiguousColumnInfo { columns: string[] }
export interface TimeoutInfo { message: string }

export function isColumnNotFound(err: any): ColumnNotFoundInfo | null {
  const msg = String(err?.message ?? err ?? '');
  // Common error formats:
  // "SQL compilation error: error line X at position Y invalid identifier 'FOO'"
  // "invalid identifier 'FOO'"
  // "no such column: FOO"
  const m = msg.match(/invalid identifier\s*['"]([^'"]+)['"]/gi);
  if (m) {
    const cols = Array.from(new Set(m.map(s => {
      const match = s.match(/invalid identifier\s*['"]([^'"]+)['"]/i);
      return match ? match[1] : '';
    }).filter(Boolean)));
    return { missingColumns: cols };
  }
  // Fallback phrase:
  if (/column .* not found/i.test(msg)) {
    const c = (msg.match(/column ([^ ]+) not found/i) || [,''])[1];
    return { missingColumns: c ? [c.replace(/["']/g,'')] : [] };
  }
  return null;
}

export function isAmbiguousColumn(err: any): AmbiguousColumnInfo | null {
  const msg = String(err?.message ?? err ?? '');
  // "ambiguous column name" or "ambiguous"
  if (/ambiguous/i.test(msg) && /column/i.test(msg)) {
    // Try to extract names in quotes
    const cols = Array.from(new Set((msg.match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g,''))));
    return { columns: cols.length ? cols : ['(unknown)'] };
  }
  return null;
}

export function isTimeout(err: any): TimeoutInfo | null {
  const msg = String(err?.message ?? err ?? '');
  if (/timeout/i.test(msg)) return { message: msg };
  // Statement timeout error
  if (/Statement timeout/i.test(msg)) return { message: msg };
  return null;
}

export interface QuoteSyntaxInfo { 
  message: string;
  needsSingleQuotes?: boolean; // for string literals
  needsDoubleQuotes?: boolean; // for identifiers
}

export function isQuoteSyntaxError(err: any): QuoteSyntaxInfo | null {
  const msg = String(err?.message ?? err ?? '');
  
  // SQLite specific errors about quotes:
  // "unrecognized token: "\"Technology\""
  // "no such column: \"Technology\"" (when double quotes used for strings)
  // Pattern: identifier in double quotes that doesn't exist as a column
  
  // Check if error mentions unrecognized token with quotes
  if (/unrecognized token/i.test(msg) && /"/.test(msg)) {
    return { message: msg, needsSingleQuotes: true };
  }
  
  // Check for "no such column" when the column name looks like a string literal
  if (/no such column/i.test(msg)) {
    // Extract the column name in quotes
    const match = msg.match(/no such column:\s*["']([^"']+)["']/i);
    if (match) {
      const colName = match[1];
      // If it starts with uppercase or looks like a value (not snake_case identifier)
      // it's probably a string literal that should use single quotes
      if (colName[0] === colName[0].toUpperCase() && !/^[A-Z_]+$/.test(colName)) {
        return { message: msg, needsSingleQuotes: true };
      }
    }
  }
  
  // Check for syntax errors that might be quote-related
  if ((/syntax error/i.test(msg) || /near/i.test(msg)) && /"/.test(msg)) {
    return { message: msg, needsSingleQuotes: true };
  }
  
  return null;
}