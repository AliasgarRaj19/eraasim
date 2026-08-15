import { relations, sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, date, index, inet, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const accountStatus = pgEnum("staff_account_status", ["active", "disabled"]);
export const invitationStatus = pgEnum("staff_invitation_status", ["pending", "accepted", "revoked", "expired"]);
export const postStatus = pgEnum("post_status", ["draft", "published", "scheduled", "unpublished"]);
export const genericPageStatus = pgEnum("generic_page_status", ["draft", "published", "unpublished"]);
export const jobStatus = pgEnum("job_status", ["draft", "published", "closed"]);
export const contactMessageStatus = pgEnum("contact_message_status", ["new", "read", "replied", "archived"]);

export const staffAccounts = pgTable("staff_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: accountStatus("status").notNull().default("active"),
  isMasterAdmin: boolean("is_master_admin").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("staff_accounts_email_normalized_uidx").on(sql`lower(${table.email})`),
  uniqueIndex("staff_accounts_single_master_uidx").on(table.isMasterAdmin).where(sql`${table.isMasterAdmin} = true`),
]);

export const staffInvitations = pgTable("staff_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  invitedById: uuid("invited_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  status: invitationStatus("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("staff_invitations_email_idx").on(table.email)]);

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  module: text("module").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]);

export const staffRoles = pgTable("staff_roles", {
  staffAccountId: uuid("staff_account_id").notNull().references(() => staffAccounts.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.staffAccountId, table.roleId] })]);

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffAccountId: uuid("staff_account_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("activity_logs_staff_created_idx").on(table.staffAccountId, table.createdAt)]);

export const homePageConfigurations = pgTable("home_page_configurations", {
  id: text("id").primaryKey(),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull(),
  published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const headerConfigurations = pgTable("header_configurations", {
  id: text("id").primaryKey(),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull(),
  published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const footerConfigurations = pgTable("footer_configurations", {
  id: text("id").primaryKey(),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull(),
  published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const themeConfigurations = pgTable("theme_configurations", {
  id: text("id").primaryKey(),
  draft: jsonb("draft").$type<Record<string, unknown>>().notNull(),
  published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blogPageConfigurations = pgTable("blog_page_configurations", {
  id: text("id").primaryKey(), draft: jsonb("draft").$type<Record<string, unknown>>().notNull(), published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1), publishedAt: timestamp("published_at", { withTimezone: true }), publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactPageConfigurations = pgTable("contact_page_configurations", {
  id: text("id").primaryKey(), draft: jsonb("draft").$type<Record<string, unknown>>().notNull(), published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1), publishedAt: timestamp("published_at", { withTimezone: true }), publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const aboutPageConfigurations = pgTable("about_page_configurations", {
  id: text("id").primaryKey(), draft: jsonb("draft").$type<Record<string, unknown>>().notNull(), published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1), publishedAt: timestamp("published_at", { withTimezone: true }), publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const careersPageConfigurations = pgTable("careers_page_configurations", {
  id: text("id").primaryKey(), draft: jsonb("draft").$type<Record<string, unknown>>().notNull(), published: jsonb("published").$type<Record<string, unknown>>(),
  draftVersion: integer("draft_version").notNull().default(1), publishedAt: timestamp("published_at", { withTimezone: true }), publishedById: uuid("published_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), email: text("email").notNull(), phone: text("phone"), subject: text("subject").notNull(), message: text("message").notNull(),
  status: contactMessageStatus("status").notNull().default("new"), submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  notificationSent: boolean("notification_sent").notNull().default(false), notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
}, (table) => [index("contact_messages_status_idx").on(table.status), index("contact_messages_submitted_idx").on(table.submittedAt)]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  description: text("description"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  featuredPostId: uuid("featured_post_id").references((): AnyPgColumn => posts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("categories_name_normalized_uidx").on(sql`lower(${table.name})`),
  uniqueIndex("categories_slug_uidx").on(table.slug),
  index("categories_parent_idx").on(table.parentId),
  check("categories_not_self_parent_chk", sql`${table.parentId} IS NULL OR ${table.parentId} <> ${table.id}`),
]);

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  shortDescription: text("short_description").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  featuredImagePath: text("featured_image_path"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  status: postStatus("status").notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  unpublishedAt: timestamp("unpublished_at", { withTimezone: true }),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdById: uuid("created_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }),
  updatedById: uuid("updated_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("posts_slug_uidx").on(table.slug),
  index("posts_status_published_idx").on(table.status, table.publishedAt),
  index("posts_scheduled_for_idx").on(table.scheduledFor),
  index("posts_category_idx").on(table.categoryId),
  index("posts_deleted_at_idx").on(table.deletedAt),
]);

export const genericPages = pgTable("generic_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  status: genericPageStatus("status").notNull().default("draft"),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  featuredImagePath: text("featured_image_path"),
  featuredImageAlt: text("featured_image_alt"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdById: uuid("created_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }),
  updatedById: uuid("updated_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("generic_pages_slug_uidx").on(table.slug),
  index("generic_pages_status_idx").on(table.status),
  index("generic_pages_deleted_at_idx").on(table.deletedAt),
  index("generic_pages_published_at_idx").on(table.publishedAt),
]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(), title: text("title").notNull(), slug: text("slug").notNull(), shortDescription: text("short_description").notNull(), description: jsonb("description").$type<Record<string, unknown>>().notNull(),
  location: text("location"), employmentType: text("employment_type"), department: text("department"), experience: text("experience"), status: jobStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }), closedAt: timestamp("closed_at", { withTimezone: true }), deletedAt: timestamp("deleted_at", { withTimezone: true }), seoTitle: text("seo_title"), seoDescription: text("seo_description"),
  createdById: uuid("created_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }), updatedById: uuid("updated_by_id").notNull().references(() => staffAccounts.id, { onDelete: "restrict" }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("jobs_slug_uidx").on(table.slug), index("jobs_status_published_idx").on(table.status, table.publishedAt), index("jobs_deleted_at_idx").on(table.deletedAt)]);

export const postDailyViews = pgTable("post_daily_views", {
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  viewDate: date("view_date", { mode: "string" }).notNull(),
  viewCount: integer("view_count").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.postId, table.viewDate] }),
  index("post_daily_views_date_count_idx").on(table.viewDate, table.viewCount),
  check("post_daily_views_nonnegative_chk", sql`${table.viewCount} >= 0`),
]);

export const staffAccountsRelations = relations(staffAccounts, ({ many }) => ({
  roles: many(staffRoles),
  invitations: many(staffInvitations),
  activityLogs: many(activityLogs),
  createdPosts: many(posts, { relationName: "postCreator" }),
  updatedPosts: many(posts, { relationName: "postUpdater" }),
  createdPages: many(genericPages, { relationName: "pageCreator" }),
  updatedPages: many(genericPages, { relationName: "pageUpdater" }),
  createdJobs: many(jobs, { relationName: "jobCreator" }), updatedJobs: many(jobs, { relationName: "jobUpdater" }),
}));
export const rolesRelations = relations(roles, ({ many }) => ({ staff: many(staffRoles), permissions: many(rolePermissions) }));
export const permissionsRelations = relations(permissions, ({ many }) => ({ roles: many(rolePermissions) }));
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "categoryHierarchy" }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  posts: many(posts),
}));
export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  createdBy: one(staffAccounts, { fields: [posts.createdById], references: [staffAccounts.id], relationName: "postCreator" }),
  updatedBy: one(staffAccounts, { fields: [posts.updatedById], references: [staffAccounts.id], relationName: "postUpdater" }),
  dailyViews: many(postDailyViews),
}));
export const genericPagesRelations = relations(genericPages, ({ one }) => ({
  createdBy: one(staffAccounts, { fields: [genericPages.createdById], references: [staffAccounts.id], relationName: "pageCreator" }),
  updatedBy: one(staffAccounts, { fields: [genericPages.updatedById], references: [staffAccounts.id], relationName: "pageUpdater" }),
}));
export const jobsRelations = relations(jobs, ({ one }) => ({ createdBy: one(staffAccounts, { fields: [jobs.createdById], references: [staffAccounts.id], relationName: "jobCreator" }), updatedBy: one(staffAccounts, { fields: [jobs.updatedById], references: [staffAccounts.id], relationName: "jobUpdater" }) }));
export const postDailyViewsRelations = relations(postDailyViews, ({ one }) => ({ post: one(posts, { fields: [postDailyViews.postId], references: [posts.id] }) }));
