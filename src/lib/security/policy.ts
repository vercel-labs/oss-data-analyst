// lib/security/policy.ts

/**
 * Detect if we're using SQLite (default for development/demo)
 * SQLite uses "main" as the default schema name
 */
function isUsingSQLite(): boolean {
  // If SNOWFLAKE_ACCOUNT is not set, we're likely using SQLite
  return !process.env.SNOWFLAKE_ACCOUNT;
}

/**
 * Get allowed schemas based on database type
 * - SQLite: Always includes "main" schema
 * - Snowflake/Other: Uses ALLOWED_SCHEMAS env var or default
 */
export function getAllowedSchemas(): string[] {
  const envSchemas = (process.env.ALLOWED_SCHEMAS ?? "analytics,crm,main")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // If using SQLite, ensure "main" is always allowed
  if (isUsingSQLite()) {
    if (!envSchemas.includes("main")) {
      envSchemas.push("main");
    }
  }

  return envSchemas;
}

export const allowedSchemas = getAllowedSchemas();

export function parseTableIdent(ident: string): {
  db?: string;
  schema?: string;
  table?: string;
} {
  // Snowflake fully qualified: <db>.<schema>.<table>
  const parts = ident.split(".");
  if (parts.length === 3)
    return { db: parts[0], schema: parts[1], table: parts[2] };
  if (parts.length === 2) return { schema: parts[0], table: parts[1] };
  if (parts.length === 1) return { table: parts[0] };
  return {};
}

export function verifyAllowedTables(
  registry: Map<string, { table: string }>,
  allowed: string[] = getAllowedSchemas()
) {
  const violations: string[] = [];
  for (const [entity, ent] of registry.entries()) {
    const parsed = parseTableIdent(ent.table);
    if (!parsed.schema) {
      violations.push(
        `Entity "${entity}" table "${ent.table}" is not schema-qualified.`
      );
      continue;
    }
    if (!allowed.includes(parsed.schema)) {
      violations.push(
        `Entity "${entity}" table schema "${parsed.schema}" not in allowed list: [${allowed.join(", ")}]`
      );
    }
  }
  if (violations.length > 0) {
    const msg = "Security policy violation: " + violations.join("; ");
    throw new Error(msg);
  }
}
