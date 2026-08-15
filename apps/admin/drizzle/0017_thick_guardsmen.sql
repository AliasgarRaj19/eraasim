CREATE TYPE "public"."subscriber_delivery_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscriber_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscriber_notification_type" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('active', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "subscriber_notification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"type" "subscriber_notification_type" NOT NULL,
	"status" "subscriber_job_status" DEFAULT 'pending' NOT NULL,
	"requested_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriber_post_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_job_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"status" "subscriber_delivery_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"attempted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscriber_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"popup_enabled" boolean DEFAULT true NOT NULL,
	"popup_heading" text NOT NULL,
	"popup_description" text NOT NULL,
	"button_label" text NOT NULL,
	"popup_delay_seconds" integer DEFAULT 6 NOT NULL,
	"dismissal_cooldown_hours" integer DEFAULT 24 NOT NULL,
	"automatic_post_emails_enabled" boolean DEFAULT true NOT NULL,
	"pending_automatic_post_id" uuid,
	"last_automatic_sent_at" timestamp with time zone,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_settings_bounds_chk" CHECK ("subscriber_settings"."popup_delay_seconds" BETWEEN 0 AND 300 AND "subscriber_settings"."dismissal_cooldown_hours" BETWEEN 1 AND 720)
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'popup' NOT NULL,
	"unsubscribe_token_hash" text NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"last_notification_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "automatic_notification_participated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriber_notification_jobs" ADD CONSTRAINT "subscriber_notification_jobs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_notification_jobs" ADD CONSTRAINT "subscriber_notification_jobs_requested_by_id_staff_accounts_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_post_deliveries" ADD CONSTRAINT "subscriber_post_deliveries_notification_job_id_subscriber_notification_jobs_id_fk" FOREIGN KEY ("notification_job_id") REFERENCES "public"."subscriber_notification_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_post_deliveries" ADD CONSTRAINT "subscriber_post_deliveries_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_post_deliveries" ADD CONSTRAINT "subscriber_post_deliveries_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_settings" ADD CONSTRAINT "subscriber_settings_pending_automatic_post_id_posts_id_fk" FOREIGN KEY ("pending_automatic_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_settings" ADD CONSTRAINT "subscriber_settings_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriber_jobs_status_created_idx" ON "subscriber_notification_jobs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriber_deliveries_job_subscriber_uidx" ON "subscriber_post_deliveries" USING btree ("notification_job_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "subscriber_deliveries_job_status_idx" ON "subscriber_post_deliveries" USING btree ("notification_job_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_normalized_email_uidx" ON "subscribers" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_unsubscribe_token_hash_uidx" ON "subscribers" USING btree ("unsubscribe_token_hash");--> statement-breakpoint
CREATE INDEX "subscribers_status_subscribed_idx" ON "subscribers" USING btree ("status","subscribed_at");--> statement-breakpoint
INSERT INTO "subscriber_settings" ("id","popup_heading","popup_description","button_label") VALUES ('global','Stay inspired','Get an email when Eraasim publishes a new story.','Subscribe') ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('subscribers.view','View Subscribers','View subscriber records.','Subscribers'),
('subscribers.export','Export Subscribers','Export subscriber records as CSV.','Subscribers'),
('subscribers.settings','Manage Subscriber Settings','Manage subscriber and popup settings.','Subscribers'),
('subscribers.send','Send Subscriber Notifications','Request manual post notifications.','Subscribers')
ON CONFLICT ("key") DO NOTHING;
