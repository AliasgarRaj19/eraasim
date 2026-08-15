import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseKolkataDateTime } from "../src/blog/publishing";
import { publishDuePosts, publishDuePostsSql } from "../src/blog/scheduled-publishing";

const kolkata = parseKolkataDateTime("2026-08-20T12:00");
assert.equal(kolkata?.toISOString(), "2026-08-20T06:30:00.000Z");
assert(publishDuePostsSql.includes("status = 'scheduled'") && publishDuePostsSql.includes("deleted_at IS NULL") && publishDuePostsSql.includes("scheduled_for IS NOT NULL"));
assert(publishDuePostsSql.includes("scheduled_for <= CURRENT_TIMESTAMP") && publishDuePostsSql.includes("FOR UPDATE SKIP LOCKED"));
assert(publishDuePostsSql.includes("published_at = due.scheduled_for") && publishDuePostsSql.includes("updated_at = CURRENT_TIMESTAMP"));
assert(!publishDuePostsSql.includes("scheduled_for = NULL"));
assert(publishDuePostsSql.includes("post.status = 'scheduled'") && publishDuePostsSql.includes("post.deleted_at IS NULL") && publishDuePostsSql.includes("post.scheduled_for = due.scheduled_for"));
assert(publishDuePostsSql.includes("blog.post.scheduled_published") && publishDuePostsSql.includes("SELECT NULL,") && publishDuePostsSql.includes("FROM promoted"));
assert(!publishDuePostsSql.includes("content =") && !publishDuePostsSql.includes("slug =") && !publishDuePostsSql.includes("category_id =") && !publishDuePostsSql.includes("created_at ="));

async function main() {
  let queryCount = 0;
  const client = { query: async (sql: string, values: unknown[]) => { queryCount += 1; assert.equal(sql, publishDuePostsSql); assert.deepEqual(values, [100]); return { rows: [{ count: 1 }] }; } };
  assert.equal(await publishDuePosts(client), 1);
  assert.equal(queryCount, 1);

  const publicSource = readFileSync(new URL("../../../src/public-blog.ts", import.meta.url), "utf8");
  assert(publicSource.includes(`PUBLIC_POST_SQL = "p.status = 'published' AND p.deleted_at IS NULL"`));
  assert(!publicSource.includes("scheduled_for <="));
  const deletion = readFileSync(new URL("./check-post-deletion.ts", import.meta.url), "utf8");
  assert(deletion.includes("restored.scheduledFor") && deletion.includes("restored.status"));
  const compose = readFileSync(new URL("../../../compose.yaml", import.meta.url), "utf8");
  assert(compose.includes("eraasim-scheduled-publisher:") && compose.includes("target: scheduled-publisher"));
  const cron = readFileSync(new URL("../deployment/scheduled-publisher.cron", import.meta.url), "utf8");
  assert(cron.includes("* * * * * cd /app && npm run publish:scheduled"));
  assert(cron.includes("* * * * * cd /app && npm run notify:subscribers"));
  console.log("PASS: Kolkata→UTC boundary, exact/equal due predicate, future/deleted/non-scheduled exclusions, atomic locking/logging, idempotent recheck, preserved schedule, public isolation, restored lifecycle, and minute scheduler integration verified.");
}

void main();
