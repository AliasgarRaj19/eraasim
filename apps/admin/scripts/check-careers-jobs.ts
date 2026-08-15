import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { defaultCareersConfig, parseCareersConfig } from "../src/careers/config";
import { jobPublishing, normalizeJobSlug } from "../src/jobs/job";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

assert.equal(defaultCareersConfig.jobs.perPage, 10);
assert(parseCareersConfig(defaultCareersConfig).success);
assert(!parseCareersConfig({ ...defaultCareersConfig, jobs: { ...defaultCareersConfig.jobs, perPage: 30 } }).success);
assert(!parseCareersConfig({ ...defaultCareersConfig, intro: { title: "<b>Careers</b>", description: "" } }).success);
assert.equal(normalizeJobSlug("Senior News Editor"), "senior-news-editor");

const old = new Date("2026-01-01T00:00:00Z");
const now = new Date("2026-02-01T00:00:00Z");
assert.deepEqual(jobPublishing({ status: "draft", publishedAt: null, closedAt: null }, "published", now), { status: "published", publishedAt: now, closedAt: null });
assert.deepEqual(jobPublishing({ status: "published", publishedAt: old, closedAt: null }, "closed", now), { status: "closed", publishedAt: old, closedAt: now });
assert.deepEqual(jobPublishing({ status: "closed", publishedAt: old, closedAt: old }, "published", now), { status: "published", publishedAt: now, closedAt: null });
assert.deepEqual(jobPublishing({ status: "closed", publishedAt: old, closedAt: old }, "draft", now), { status: "draft", publishedAt: old, closedAt: null });

const migration = read("drizzle/0013_harsh_vision.sql");
for (const permission of ["pages.careers.view", "pages.careers.edit", "pages.careers.publish", "jobs.view", "jobs.create", "jobs.edit", "jobs.publish", "jobs.delete"]) assert(migration.includes(permission));
const actions = read("app/(admin)/jobs/actions.ts");
for (const event of ["job.created", "job.updated", "job.published", "job.closed", "job.deleted", "job.restored"]) assert(actions.includes(event));
assert(actions.includes('status:"closed"'));
assert(read("src/generic-pages/generic-page.ts").includes('"careers"'));
assert(read("src/navigation/admin-navigation.ts").includes('href: "/pages/careers"'));
assert(read("src/navigation/admin-navigation.ts").includes('href: "/jobs"'));
console.log("Careers CMS and Job CRUD regression checks passed.");
