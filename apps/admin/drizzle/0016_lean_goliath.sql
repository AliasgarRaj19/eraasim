CREATE TABLE "blog_engagement_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"likes_enabled" boolean DEFAULT true NOT NULL,
	"sharing_enabled" boolean DEFAULT true NOT NULL,
	"whatsapp_enabled" boolean DEFAULT true NOT NULL,
	"facebook_enabled" boolean DEFAULT true NOT NULL,
	"x_enabled" boolean DEFAULT true NOT NULL,
	"linkedin_enabled" boolean DEFAULT true NOT NULL,
	"copy_link_enabled" boolean DEFAULT true NOT NULL,
	"native_share_enabled" boolean DEFAULT true NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"anonymous_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "likes_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sharing_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_engagement_settings" ADD CONSTRAINT "blog_engagement_settings_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_likes_post_idx" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_likes_post_token_uidx" ON "post_likes" USING btree ("post_id","anonymous_token_hash");--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('engagement.view','View Engagement Settings','View Blog Post engagement settings.','Engagement'),
('engagement.settings','Manage Engagement Settings','Manage global Blog Post engagement settings.','Engagement')
ON CONFLICT ("key") DO NOTHING;
