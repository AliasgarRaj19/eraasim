import { relations, sql } from "drizzle-orm";
import { type AnyPgColumn, boolean, check, date, index, inet, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const accountStatus = pgEnum("staff_account_status", ["active", "disabled"]);
export const invitationStatus = pgEnum("staff_invitation_status", ["pending", "accepted", "revoked", "expired"]);
export const postStatus = pgEnum("post_status", ["draft", "published", "scheduled", "unpublished"]);
export const genericPageStatus = pgEnum("generic_page_status", ["draft", "published", "unpublished"]);
export const jobStatus = pgEnum("job_status", ["draft", "published", "closed"]);
export const contactMessageStatus = pgEnum("contact_message_status", ["new", "read", "replied", "archived"]);
export const blogCommentStatus = pgEnum("blog_comment_status", ["pending", "approved", "rejected", "spam"]);
export const subscriberStatus = pgEnum("subscriber_status", ["active", "unsubscribed"]);
export const subscriberNotificationType = pgEnum("subscriber_notification_type", ["automatic", "manual"]);
export const subscriberJobStatus = pgEnum("subscriber_job_status", ["pending", "processing", "completed", "failed"]);
export const subscriberDeliveryStatus = pgEnum("subscriber_delivery_status", ["pending", "processing", "sent", "failed"]);

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
  commentsEnabled: boolean("comments_enabled").notNull().default(true),
  likesEnabled: boolean("likes_enabled").notNull().default(true),
  sharingEnabled: boolean("sharing_enabled").notNull().default(true),
  automaticNotificationParticipatedAt: timestamp("automatic_notification_participated_at", { withTimezone: true }),
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

export const blogEngagementSettings = pgTable("blog_engagement_settings", {
  id: text("id").primaryKey(),
  likesEnabled: boolean("likes_enabled").notNull().default(true), sharingEnabled: boolean("sharing_enabled").notNull().default(true),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true), facebookEnabled: boolean("facebook_enabled").notNull().default(true),
  xEnabled: boolean("x_enabled").notNull().default(true), linkedinEnabled: boolean("linkedin_enabled").notNull().default(true),
  copyLinkEnabled: boolean("copy_link_enabled").notNull().default(true), nativeShareEnabled: boolean("native_share_enabled").notNull().default(true),
  updatedById: uuid("updated_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const postLikes = pgTable("post_likes", {
  id: uuid("id").primaryKey().defaultRandom(), postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tokenHash: text("anonymous_token_hash").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("post_likes_post_idx").on(table.postId), uniqueIndex("post_likes_post_token_uidx").on(table.postId, table.tokenHash)]);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(), email: text("email").notNull(), normalizedEmail: text("normalized_email").notNull(), status: subscriberStatus("status").notNull().default("active"), source: text("source").notNull().default("popup"), unsubscribeTokenHash: text("unsubscribe_token_hash").notNull(), subscribedAt: timestamp("subscribed_at",{withTimezone:true}).notNull().defaultNow(), unsubscribedAt: timestamp("unsubscribed_at",{withTimezone:true}), lastNotificationAt: timestamp("last_notification_at",{withTimezone:true}), createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(), updatedAt: timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("subscribers_normalized_email_uidx").on(t.normalizedEmail),uniqueIndex("subscribers_unsubscribe_token_hash_uidx").on(t.unsubscribeTokenHash),index("subscribers_status_subscribed_idx").on(t.status,t.subscribedAt)]);
export const subscriberSettings = pgTable("subscriber_settings", {
  id:text("id").primaryKey(),enabled:boolean("enabled").notNull().default(true),popupEnabled:boolean("popup_enabled").notNull().default(true),popupHeading:text("popup_heading").notNull(),popupDescription:text("popup_description").notNull(),buttonLabel:text("button_label").notNull(),popupDelaySeconds:integer("popup_delay_seconds").notNull().default(6),dismissalCooldownHours:integer("dismissal_cooldown_hours").notNull().default(24),automaticPostEmailsEnabled:boolean("automatic_post_emails_enabled").notNull().default(true),pendingAutomaticPostId:uuid("pending_automatic_post_id").references(()=>posts.id,{onDelete:"set null"}),lastAutomaticSentAt:timestamp("last_automatic_sent_at",{withTimezone:true}),updatedById:uuid("updated_by_id").references(()=>staffAccounts.id,{onDelete:"set null"}),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[check("subscriber_settings_bounds_chk",sql`${t.popupDelaySeconds} BETWEEN 0 AND 300 AND ${t.dismissalCooldownHours} BETWEEN 1 AND 720`)]);
export const subscriberNotificationJobs = pgTable("subscriber_notification_jobs", {
 id:uuid("id").primaryKey().defaultRandom(),postId:uuid("post_id").notNull().references(()=>posts.id,{onDelete:"cascade"}),type:subscriberNotificationType("type").notNull(),status:subscriberJobStatus("status").notNull().default("pending"),requestedById:uuid("requested_by_id").references(()=>staffAccounts.id,{onDelete:"set null"}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),startedAt:timestamp("started_at",{withTimezone:true}),completedAt:timestamp("completed_at",{withTimezone:true}),recipientCount:integer("recipient_count").notNull().default(0),successCount:integer("success_count").notNull().default(0),failureCount:integer("failure_count").notNull().default(0),
},t=>[index("subscriber_jobs_status_created_idx").on(t.status,t.createdAt)]);
export const subscriberPostDeliveries = pgTable("subscriber_post_deliveries", {
 id:uuid("id").primaryKey().defaultRandom(),notificationJobId:uuid("notification_job_id").notNull().references(()=>subscriberNotificationJobs.id,{onDelete:"cascade"}),subscriberId:uuid("subscriber_id").notNull().references(()=>subscribers.id,{onDelete:"cascade"}),postId:uuid("post_id").notNull().references(()=>posts.id,{onDelete:"cascade"}),status:subscriberDeliveryStatus("status").notNull().default("pending"),sentAt:timestamp("sent_at",{withTimezone:true}),attemptedAt:timestamp("attempted_at",{withTimezone:true}),
},t=>[uniqueIndex("subscriber_deliveries_job_subscriber_uidx").on(t.notificationJobId,t.subscriberId),index("subscriber_deliveries_job_status_idx").on(t.notificationJobId,t.status)]);

export const commentsSettings = pgTable("comments_settings", {
  id: text("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  autoApprove: boolean("auto_approve").notNull().default(false),
  initialCount: integer("initial_count").notNull().default(10),
  loadMoreCount: integer("load_more_count").notNull().default(10),
  pendingMessage: text("pending_message").notNull(),
  approvedMessage: text("approved_message").notNull(),
  updatedById: uuid("updated_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("comments_settings_counts_chk", sql`${table.initialCount} BETWEEN 5 AND 50 AND ${table.loadMoreCount} BETWEEN 5 AND 50`)]);

export const blogComments = pgTable("blog_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentCommentId: uuid("parent_comment_id").references((): AnyPgColumn => blogComments.id, { onDelete: "cascade" }),
  name: text("name").notNull(), email: text("email").notNull(), comment: text("comment").notNull(),
  status: blogCommentStatus("status").notNull().default("pending"), isAdminReply: boolean("is_admin_reply").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(), deletedAt: timestamp("deleted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }), approvedById: uuid("approved_by_id").references(() => staffAccounts.id, { onDelete: "set null" }),
  notificationSent: boolean("notification_sent").notNull().default(false), notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }), notificationAttemptedAt: timestamp("notification_attempted_at", { withTimezone: true }),
}, (table) => [index("blog_comments_post_status_created_idx").on(table.postId, table.status, table.createdAt), index("blog_comments_status_idx").on(table.status), index("blog_comments_deleted_idx").on(table.deletedAt)]);

export const commentLikes = pgTable("comment_likes", {
  id: uuid("id").primaryKey().defaultRandom(), commentId: uuid("comment_id").notNull().references(() => blogComments.id, { onDelete: "cascade" }), tokenHash: text("anonymous_token_hash").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("comment_likes_comment_idx").on(table.commentId), uniqueIndex("comment_likes_comment_token_uidx").on(table.commentId, table.tokenHash)]);

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
