CREATE TYPE "public"."admin_notification_module" AS ENUM('contact', 'comments', 'subscribers', 'staff', 'blog', 'system');--> statement-breakpoint
CREATE TYPE "public"."admin_notification_severity" AS ENUM('info', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."admin_notification_status" AS ENUM('unread', 'read', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."admin_notification_type" AS ENUM('contact_email_failed', 'comment_reply_email_failed', 'subscriber_job_failed', 'subscriber_worker_failed', 'staff_invitation_email_failed', 'password_reset_email_failed', 'scheduled_publishing_failed');--> statement-breakpoint
CREATE TABLE "admin_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "admin_notification_type" NOT NULL,
	"module" "admin_notification_module" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"target_type" text,
	"target_id" uuid,
	"target_url" text,
	"severity" "admin_notification_severity" DEFAULT 'warning' NOT NULL,
	"status" "admin_notification_status" DEFAULT 'unread' NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "admin_notifications_content_bounds_chk" CHECK (char_length("admin_notifications"."title") BETWEEN 1 AND 160 AND char_length("admin_notifications"."message") BETWEEN 1 AND 500 AND char_length("admin_notifications"."dedupe_key") BETWEEN 1 AND 240),
	CONSTRAINT "admin_notifications_target_url_chk" CHECK ("admin_notifications"."target_url" IS NULL OR ("admin_notifications"."target_url" LIKE '/%' AND "admin_notifications"."target_url" NOT LIKE '//%' AND char_length("admin_notifications"."target_url") <= 300))
);
--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "admin_seen_at" timestamp with time zone;--> statement-breakpoint
UPDATE "subscribers" SET "admin_seen_at" = CURRENT_TIMESTAMP WHERE "status" = 'active';--> statement-breakpoint
CREATE INDEX "admin_notifications_status_created_idx" ON "admin_notifications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "admin_notifications_module_status_idx" ON "admin_notifications" USING btree ("module","status");--> statement-breakpoint
CREATE INDEX "admin_notifications_target_idx" ON "admin_notifications" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_notifications_unresolved_dedupe_uidx" ON "admin_notifications" USING btree ("dedupe_key") WHERE "admin_notifications"."status" <> 'resolved';--> statement-breakpoint
CREATE INDEX "subscribers_status_admin_seen_idx" ON "subscribers" USING btree ("status","admin_seen_at");--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('notifications.view','View Notifications','View operational notifications for accessible modules.','Notifications'),
('notifications.manage','Manage Notifications','Mark operational notifications read and resolve them.','Notifications')
ON CONFLICT ("key") DO NOTHING;
