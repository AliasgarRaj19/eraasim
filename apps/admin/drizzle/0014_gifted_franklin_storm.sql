CREATE TYPE "public"."blog_comment_status" AS ENUM('pending', 'approved', 'rejected', 'spam');--> statement-breakpoint
CREATE TABLE "blog_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"comment" text NOT NULL,
	"status" "blog_comment_status" DEFAULT 'pending' NOT NULL,
	"is_admin_reply" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"anonymous_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"auto_approve" boolean DEFAULT false NOT NULL,
	"initial_count" integer DEFAULT 10 NOT NULL,
	"load_more_count" integer DEFAULT 10 NOT NULL,
	"pending_message" text NOT NULL,
	"approved_message" text NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_settings_counts_chk" CHECK ("comments_settings"."initial_count" BETWEEN 5 AND 50 AND "comments_settings"."load_more_count" BETWEEN 5 AND 50)
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "comments_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parent_comment_id_blog_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."blog_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_approved_by_id_staff_accounts_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_blog_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."blog_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments_settings" ADD CONSTRAINT "comments_settings_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_comments_post_status_created_idx" ON "blog_comments" USING btree ("post_id","status","created_at");--> statement-breakpoint
CREATE INDEX "blog_comments_status_idx" ON "blog_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_comments_deleted_idx" ON "blog_comments" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "comment_likes_comment_idx" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_likes_comment_token_uidx" ON "comment_likes" USING btree ("comment_id","anonymous_token_hash");
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('comments.view','View Comments','View Blog comments and moderation details.','Comments'),
('comments.moderate','Moderate Comments','Approve, reject, spam, and delete Blog comments.','Comments'),
('comments.reply','Reply to Comments','Add approved Admin replies to Blog comments.','Comments'),
('comments.settings','Manage Comment Settings','Manage global Blog comment settings.','Comments')
ON CONFLICT ("key") DO NOTHING;
