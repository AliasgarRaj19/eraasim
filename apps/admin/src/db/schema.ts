import { relations, sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, index, inet, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const accountStatus = pgEnum("staff_account_status", ["active", "disabled"]);
export const invitationStatus = pgEnum("staff_invitation_status", ["pending", "accepted", "revoked", "expired"]);
export const postStatus = pgEnum("post_status", ["draft", "published", "scheduled", "unpublished"]);

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

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "restrict" }),
  description: text("description"),
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

export const staffAccountsRelations = relations(staffAccounts, ({ many }) => ({
  roles: many(staffRoles),
  invitations: many(staffInvitations),
  activityLogs: many(activityLogs),
  createdPosts: many(posts, { relationName: "postCreator" }),
  updatedPosts: many(posts, { relationName: "postUpdater" }),
}));
export const rolesRelations = relations(roles, ({ many }) => ({ staff: many(staffRoles), permissions: many(rolePermissions) }));
export const permissionsRelations = relations(permissions, ({ many }) => ({ roles: many(rolePermissions) }));
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "categoryHierarchy" }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  posts: many(posts),
}));
export const postsRelations = relations(posts, ({ one }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  createdBy: one(staffAccounts, { fields: [posts.createdById], references: [staffAccounts.id], relationName: "postCreator" }),
  updatedBy: one(staffAccounts, { fields: [posts.updatedById], references: [staffAccounts.id], relationName: "postUpdater" }),
}));
