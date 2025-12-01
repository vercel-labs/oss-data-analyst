// SQL validation for syntax and semantic checks

import type { FinalizedPlan } from '@/lib/planning/types';
import type { EntityJson } from '@/lib/semantic/types';
import { verifyAllowedTables } from '@/lib/security/policy';

/**
 * Normalize SQLite quote syntax:
 * - Single quotes (') for string literals
 * - Double quotes (") for identifiers (table/column names)
 * 
 * This function converts double-quoted strings to single quotes when they appear
 * to be string literals rather than identifiers.
 */
export function normalizeSQLiteQuotes(sql: string, registry: Map<string, EntityJson>): string {
  // Build a set of known identifiers from the registry
  const knownIdentifiers = new Set<string>();
  for (const [, ent] of registry) {
    knownIdentifiers.add(ent.name);
    knownIdentifiers.add(ent.table);
    for (const d of ent.dimensions) {
      knownIdentifiers.add(d.name);
      if (d.aliases) {
        d.aliases.forEach(a => knownIdentifiers.add(a));
      }
    }
    for (const td of ent.time_dimensions) {
      knownIdentifiers.add(td.name);
    }
    for (const m of ent.measures) {
      knownIdentifiers.add(m.name);
    }
  }
  
  // Also add common SQL keywords and functions that might be quoted
  const sqlKeywords = new Set([
    'select', 'from', 'where', 'group', 'by', 'order', 'having', 'join',
    'left', 'right', 'inner', 'outer', 'on', 'as', 'and', 'or', 'not',
    'count', 'sum', 'avg', 'min', 'max', 'distinct', 'limit', 'offset'
  ]);
  
  let result = '';
  let i = 0;
  
  while (i < sql.length) {
    const ch = sql[i];
    
    // Handle single-quoted strings (keep as-is)
    if (ch === "'") {
      result += ch;
      i++;
      // Find the closing quote
      while (i < sql.length) {
        result += sql[i];
        if (sql[i] === "'" && sql[i - 1] !== '\\') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    
    // Handle double-quoted strings (analyze and potentially convert)
    if (ch === '"') {
      let token = '';
      i++; // skip opening quote
      
      // Extract the token inside double quotes
      while (i < sql.length && sql[i] !== '"') {
        token += sql[i];
        i++;
      }
      
      i++; // skip closing quote
      
      // Decide if this is an identifier or a string literal
      const isIdentifier = 
        knownIdentifiers.has(token) ||
        knownIdentifiers.has(token.toLowerCase()) ||
        sqlKeywords.has(token.toLowerCase()) ||
        // Match identifier patterns: snake_case, camelCase, or SQL standard
        /^[a-z_][a-z0-9_]*$/i.test(token);
      
      if (isIdentifier) {
        // Keep as identifier with double quotes
        result += '"' + token + '"';
      } else {
        // Convert to string literal with single quotes
        // Escape any single quotes in the token
        const escapedToken = token.replace(/'/g, "''");
        result += "'" + escapedToken + "'";
      }
      continue;
    }
    
    // Regular character
    result += ch;
    i++;
  }
  
  return result;
}

const DISALLOWED = [
  /\bDROP\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bMERGE\b/i,
  /\bCOPY\b/i,
  /\bPUT\b/i,
  /\bGET\b/i,
];

export function syntaxScan(sql: string) {
  const res = { ok: true, syntaxOk: true, issues: [] as string[] };

  // Single statement: forbid semicolons except trailing
  const lines = sql.split('\n');
  const cleanedSql = sql.trim();

  // Check for semicolons not at the end
  const semis = cleanedSql.split(';').length - 1;
  const endsWithSemi = cleanedSql.endsWith(';');

  if (semis > 1 || (semis === 1 && !endsWithSemi)) {
    res.ok = false;
    res.syntaxOk = false;
    res.issues.push('Multiple statements detected.');
  }

  for (const rx of DISALLOWED) {
    if (rx.test(sql)) {
      res.ok = false;
      res.syntaxOk = false;
      res.issues.push(`Disallowed token: ${rx.source}`);
    }
  }

  // Crude multi-line comment close check
  const openComments = (sql.match(/\/\*/g) || []).length;
  const closeComments = (sql.match(/\*\//g) || []).length;
  if (openComments !== closeComments) {
    res.ok = false;
    res.syntaxOk = false;
    res.issues.push('Unclosed or unmatched block comment.');
  }

  return { ok: res.ok, issues: res.issues };
}

export function semanticCheck(
  plan: FinalizedPlan,
  sql: string,
  registry: Map<string, EntityJson>
) {
  const issues: string[] = [];

  // Enforce schema whitelist early
  try {
    verifyAllowedTables(registry as any);
  } catch (e: any) {
    issues.push(String(e.message ?? e));
  }

  // Entities must be loaded
  for (const e of plan.selectedEntities) {
    if (!registry.has(e)) {
      issues.push(`Selected entity "${e}" not loaded.`);
    }
  }

  // Join edges reference entities that must be present
  for (const j of plan.joinGraph) {
    if (!registry.has(j.from)) {
      issues.push(`Join edge from missing entity "${j.from}".`);
    }
    if (!registry.has(j.to)) {
      issues.push(`Join edge to missing entity "${j.to}".`);
    }
  }

  // Helper function to check if a field exists in any entity
  const existsInAnyEntity = (name: string, checkDimensions = true, checkTime = true) => {
    // Handle entity.field notation
    if (name.includes('.')) {
      const [entityName, fieldName] = name.split('.');
      const ent = registry.get(entityName);
      if (!ent) return false;

      // Check dimensions
      if (checkDimensions && ent._dimIndex.has(fieldName)) return true;

      // Check time dimensions
      if (checkTime) {
        const hasTimeDim = ent.time_dimensions.some(td => td.name === fieldName);
        if (hasTimeDim) return true;
      }

      // Check via alias
      const canonical = ent._reverseAliasIndex.get(fieldName);
      if (canonical) {
        if (checkDimensions && ent._dimIndex.has(canonical)) return true;
        if (checkTime) {
          const hasTimeDim = ent.time_dimensions.some(td => td.name === canonical);
          if (hasTimeDim) return true;
        }
      }

      return false;
    }

    // Check all entities
    for (const [, ent] of registry) {
      // Check dimensions
      if (checkDimensions && ent._dimIndex.has(name)) return true;

      // Check time dimensions
      if (checkTime) {
        const hasTimeDim = ent.time_dimensions.some(td => td.name === name);
        if (hasTimeDim) return true;
      }

      // Check via alias
      const canonical = ent._reverseAliasIndex.get(name);
      if (canonical) {
        if (checkDimensions && ent._dimIndex.has(canonical)) return true;
        if (checkTime) {
          const hasTimeDim = ent.time_dimensions.some(td => td.name === canonical);
          if (hasTimeDim) return true;
        }
      }
    }
    return false;
  };

  // Check dimensions exist
  for (const d of plan.intent.dimensions ?? []) {
    if (!existsInAnyEntity(d)) {
      issues.push(`Dimension "${d}" not found in selected entities or aliases.`);
    }
  }

  // Metrics or measures must exist similarly
  const metricOrMeasureExists = (name: string) => {
    // Handle entity.field notation
    if (name.includes('.')) {
      const [entityName, fieldName] = name.split('.');
      const ent = registry.get(entityName);
      if (!ent) return false;

      if (ent._metricIndex.has(fieldName) || ent._measureIndex.has(fieldName)) return true;

      const canonical = ent._reverseAliasIndex.get(fieldName);
      if (canonical && (ent._metricIndex.has(canonical) || ent._measureIndex.has(canonical))) {
        return true;
      }

      return false;
    }

    // Check all entities
    for (const [, ent] of registry) {
      if (ent._metricIndex.has(name) || ent._measureIndex.has(name)) return true;

      const canonical = ent._reverseAliasIndex.get(name);
      if (canonical && (ent._metricIndex.has(canonical) || ent._measureIndex.has(canonical))) {
        return true;
      }
    }
    return false;
  };

  for (const m of plan.intent.metrics ?? []) {
    if (!metricOrMeasureExists(m)) {
      issues.push(`Metric/measure "${m}" not found in selected entities or aliases.`);
    }
  }

  // Time range presence check if plan specifies one
  if (plan.intent.timeRange) {
    let hasTimeDim = false;
    for (const [, ent] of registry) {
      if ((ent.time_dimensions ?? []).length > 0) {
        hasTimeDim = true;
        break;
      }
    }
    if (!hasTimeDim) {
      issues.push('Time range provided but no time dimensions available.');
    }
  }

  const ok = issues.length === 0;
  return { ok, issues, semanticOk: ok };
}