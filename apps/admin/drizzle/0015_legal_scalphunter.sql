ALTER TABLE "blog_comments" ADD COLUMN "notification_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "notification_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD COLUMN "notification_attempted_at" timestamp with time zone;