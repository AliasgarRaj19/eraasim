import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { canUsePermission } from "../src/auth/authorization";
import { parseAndNormalizeContent } from "../src/blog/content";
import { competingSlugPredicate, editablePostPredicate } from "../src/blog/post-edit";
import { parsePostFormData } from "../src/blog/post-input";
import { formatKolkataDateTime, resolvePublishingState } from "../src/blog/publishing";

const now = new Date("2026-08-12T06:30:00.000Z");
const draft = { status: "draft" as const, scheduledFor: null, publishedAt: null, unpublishedAt: null };
const published = { ...draft, status: "published" as const, publishedAt: new Date("2026-08-01T00:00:00.000Z") };
const scheduled = { ...draft, status: "scheduled" as const, scheduledFor: new Date("2099-01-01T06:30:00.000Z") };

const draftToPublished = resolvePublishingState(draft, "published", "", now);
assert(draftToPublished.ok && draftToPublished.state.status === "published" && draftToPublished.state.publishedAt?.getTime() === now.getTime());
const publishedToUnpublished = resolvePublishingState(published, "unpublished", "", now);
assert(publishedToUnpublished.ok && publishedToUnpublished.state.status === "unpublished" && publishedToUnpublished.state.publishedAt === null);
const rescheduled = resolvePublishingState(scheduled, "scheduled", "2099-02-01T12:00", now);
assert(rescheduled.ok && rescheduled.state.status === "scheduled" && formatKolkataDateTime(rescheduled.state.scheduledFor) === "2099-02-01T12:00");

const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Existing content", marks: [{ type: "bold" }] }] }] };
assert.deepEqual(parseAndNormalizeContent(JSON.stringify(content)), content);

const formData = new FormData();
for (const [key, value] of Object.entries({ title: "Existing", slug: "existing-slug", shortDescription: "Existing summary", content: JSON.stringify(content), intent: "preserve" })) formData.set(key, value);
const parsed = parsePostFormData(formData);
assert(parsed.success && parsed.data.slug === "existing-slug" && parsed.data.intent === "preserve");

assert.equal(canUsePermission({ isMasterAdmin: true, permissionKeys: new Set() }, "blog.posts.edit"), true);
assert.equal(canUsePermission({ isMasterAdmin: false, permissionKeys: new Set() }, "blog.posts.edit"), false);

const dialect = new PgDialect();
const editableSql = dialect.sqlToQuery(editablePostPredicate("00000000-0000-4000-8000-000000000000")!.getSQL()).sql;
const slugSql = dialect.sqlToQuery(competingSlugPredicate("00000000-0000-4000-8000-000000000000", "existing-slug")!.getSQL()).sql;
assert(editableSql.includes("deleted_at") && editableSql.includes("id"));
assert(slugSql.includes("slug") && slugSql.includes("<>"));

console.log("PASS: transitions, scheduling, existing slug, competing-slug predicate, TipTap round-trip, deleted-post exclusion, and edit permission checks.");
