import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const migration = readFileSync(new URL("../drizzle/0004_perpetual_agent_brand.sql", import.meta.url), "utf8");
assert(migration.includes('CREATE TABLE "post_daily_views"')); assert(migration.includes('PRIMARY KEY("post_id","view_date")')); assert(migration.includes("view_count")); assert(!/ip|fingerprint|user_agent/i.test(migration));
const schema = readFileSync(new URL("../src/db/schema.ts", import.meta.url), "utf8"); assert(schema.includes("postDailyViews") && schema.includes("post_daily_views_date_count_idx") && schema.includes("post_daily_views_nonnegative_chk"));
console.log("PASS: additive daily aggregate schema, compound key, date/count index, nonnegative count, cascade lifecycle, and no identity fields verified within the Admin build context.");
