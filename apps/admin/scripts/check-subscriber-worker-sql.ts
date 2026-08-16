import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const worker=readFileSync(new URL("./notify-subscribers.ts",import.meta.url),"utf8");
assert.ok(worker.includes("status=$2::subscriber_delivery_status"));
assert.ok(worker.includes("$2::subscriber_delivery_status='sent'::subscriber_delivery_status"));
assert.ok(!worker.includes("status=$2,sent_at=CASE WHEN $2='sent'"));
for(const preserved of ["86_400_000","ORDER BY CASE j.type WHEN 'manual'","s.status='active'","LIMIT $2","FOR UPDATE OF d SKIP LOCKED","ON CONFLICT(notification_job_id,subscriber_id)","subscriber_job_failed","subscriber_worker_failed"])assert.ok(worker.includes(preserved),preserved);
console.log("Subscriber worker enum parameter typing and lifecycle preservation regression passed.");
