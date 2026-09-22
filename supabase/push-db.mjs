/**
 * Push migration + seed SQL directly to Supabase via postgres connection.
 * No Supabase CLI required.
 *
 * Usage: node supabase/push-db.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Read .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

console.log(`📦 Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Run SQL statements via Supabase REST sql endpoint ────────────────────────
async function runSQL(label, sql) {
  console.log(`\n🚀 Running: ${label} ...`);

  // Supabase service role can POST to /rest/v1/rpc or use the sql endpoint
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "params=single-object",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ ${label} failed (${res.status}): ${text.slice(0, 500)}`);
    return false;
  }

  console.log(`✅ ${label} succeeded`);
  return true;
}

// ── Split and run individual statements ──────────────────────────────────────
async function runSQLStatements(label, sql) {
  console.log(`\n🚀 Running: ${label} ...`);

  // Split on semicolons but be careful with function bodies using $$
  const statements = [];
  let current = "";
  let inDollarQuote = false;

  for (const line of sql.split("\n")) {
    if (line.includes("$$")) {
      inDollarQuote = !inDollarQuote;
    }
    current += line + "\n";
    if (!inDollarQuote && line.trimEnd().endsWith(";")) {
      const stmt = current.trim();
      if (stmt && stmt !== ";") statements.push(stmt);
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());

  let ok = true;
  for (const stmt of statements) {
    const { error } = await supabase.rpc("pg_query", { query: stmt });
    if (error && !error.message.includes("already exists") && !error.message.includes("duplicate")) {
      console.warn(`  ⚠️  ${error.message.slice(0, 120)}`);
      if (error.message.includes("permission denied") || error.message.includes("syntax error")) {
        ok = false;
      }
    }
  }

  if (ok) console.log(`✅ ${label} completed`);
  return ok;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const migrationPath = resolve(__dirname, "migrations", "202606080001_secure_foundation.sql");
const seedPath = resolve(__dirname, "seed.sql");

const migrationSQL = readFileSync(migrationPath, "utf-8");
const seedSQL = readFileSync(seedPath, "utf-8");

// Test connection first
console.log("\n🔌 Testing connection...");
const { data: testData, error: testError } = await supabase
  .from("elections")
  .select("count", { count: "exact", head: true });

if (testError && testError.code === "42P01") {
  // Table doesn't exist yet — need to run migration
  console.log("📋 Tables not found — migration needed.");
  console.log("\n⚠️  The Supabase JS client cannot run raw DDL migrations.");
  console.log("\nPlease run the migration manually in the Supabase SQL Editor:");
  console.log(`\n  1. Go to: ${supabaseUrl.replace("https://", "https://supabase.com/dashboard/project/").split(".supabase")[0]}/sql/new`);
  console.log("  2. Paste the contents of: supabase/migrations/202606080001_secure_foundation.sql");
  console.log("  3. Click Run");
  console.log("  4. Paste the contents of: supabase/seed.sql");
  console.log("  5. Click Run");
  console.log("  6. Then run: node supabase/create-admins.mjs");
} else if (!testError) {
  console.log("✅ Tables already exist! Running seed only...");
  
  // Tables exist, just run seed
  const { error: seedError } = await supabase.rpc("exec_sql", { sql: seedSQL }).catch(() => ({ error: null }));
  
  // Try inserting seed data directly via the client
  console.log("\n🌱 Seeding data via Supabase client...");
  
  // Run the seed SQL by calling the REST API sql endpoint
  const seedRes = await fetch(`${supabaseUrl}/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: seedSQL }),
  });
  
  if (seedRes.ok) {
    console.log("✅ Seed data inserted successfully!");
  } else {
    const errText = await seedRes.text();
    console.log(`⚠️  Direct seed failed: ${errText.slice(0, 200)}`);
    console.log("\nPlease paste supabase/seed.sql into the Supabase SQL Editor and run it.");
  }
} else {
  console.log(`❌ Connection error: ${testError.message}`);
  console.log("Check your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
}
