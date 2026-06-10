/**
 * Generates .env.vercel from your local .env for bulk import into Vercel.
 * Usage: npx tsx scripts/generate-vercel-env.ts [your-vercel-url]
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env");
const outPath = path.join(projectRoot, ".env.vercel");

function loadEnv(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) vars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
  }
  return vars;
}

const local = loadEnv(envPath);
const vercelUrl = (
  process.argv[2] ||
  local.APP_URL ||
  "https://motsystem.vercel.app"
).replace(/\/$/, "");

const productionSecret =
  local.NEXTAUTH_SECRET && local.NEXTAUTH_SECRET !== "local-dev-secret-change-in-production"
    ? local.NEXTAUTH_SECRET
    : crypto.randomBytes(32).toString("hex");

const vars: Record<string, string> = {
  // --- REQUIRED: paste Neon connection strings (see instructions below) ---
  DATABASE_URL: "PASTE_NEON_POOLED_CONNECTION_STRING",
  DIRECT_URL: "PASTE_NEON_DIRECT_CONNECTION_STRING",

  // --- App URLs (update after first Vercel deploy if domain differs) ---
  NEXTAUTH_URL: vercelUrl,
  APP_URL: vercelUrl,
  NEXTAUTH_SECRET: productionSecret,

  // --- DVSA (free — required for lookups) ---
  DVSA_CLIENT_ID: local.DVSA_CLIENT_ID || "",
  DVSA_CLIENT_SECRET: local.DVSA_CLIENT_SECRET || "",
  DVSA_API_KEY: local.DVSA_API_KEY || "",
  DVSA_SCOPE: local.DVSA_SCOPE || "https://tapi.dvsa.gov.uk/.default",
  DVSA_TOKEN_URL: local.DVSA_TOKEN_URL || "",
  DVSA_API_BASE: local.DVSA_API_BASE || "https://history.mot.api.gov.uk",

  // --- Optional fallbacks ---
  DVLA_API_KEY: local.DVLA_API_KEY || "",
  DVLA_VES_ENABLED: local.DVLA_VES_ENABLED || "false",
  RAPIDAPI_KEY: local.RAPIDAPI_KEY || "",
  RAPIDAPI_ENABLED: "true",
  REGCHECK_ENABLED: "false",
  REGCHECK_USERNAME: local.REGCHECK_USERNAME || "",

  // --- Auth (optional) ---
  GOOGLE_CLIENT_ID: local.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: local.GOOGLE_CLIENT_SECRET || "",

  // --- Email / SMS (optional) ---
  RESEND_API_KEY: local.RESEND_API_KEY || "",
  EMAIL_FROM: local.EMAIL_FROM || "noreply@vehicleguard.uk",
  TWILIO_ACCOUNT_SID: local.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: local.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: local.TWILIO_PHONE_NUMBER || "+447576552792",

  // --- Stripe (optional) ---
  STRIPE_SECRET_KEY: local.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: local.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PRICE_ID: local.STRIPE_PRICE_ID || "",

  // --- Cron (required for automatic daily reminders on Vercel) ---
  CRON_SECRET: crypto.randomBytes(32).toString("hex"),

  // --- Admin ---
  ADMIN_EMAIL: local.ADMIN_EMAIL || "admin@vehicleguard.uk",

};

// Vercel rejects empty values — only export vars that have a value
const lines = Object.entries(vars)
  .filter(([, v]) => v.trim() !== "")
  .map(([k, v]) => `${k}=${v}`);

fs.writeFileSync(outPath, lines.join("\n"), "utf8");

console.log(`\nWrote ${outPath}`);
console.log("\nNext steps:");
console.log("1. Create free DB at https://console.neon.tech → New Project → MOTSystem");
console.log("2. Copy 'Pooled connection' → DATABASE_URL");
console.log("3. Copy 'Direct connection' → DIRECT_URL");
console.log("4. Vercel → Settings → Environment Variables → Import .env → select .env.vercel");
console.log("5. Redeploy\n");
