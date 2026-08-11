CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'scheduled', 'unpublished');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"content" jsonb NOT NULL,
	"featured_image_path" text,
	"category_id" uuid,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"published_at" timestamp with time zone,
	"unpublished_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"created_by_id" uuid NOT NULL,
	"updated_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_id_staff_accounts_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_normalized_uidx" ON "categories" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uidx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_uidx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "posts_scheduled_for_idx" ON "posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "posts_deleted_at_idx" ON "posts" USING btree ("deleted_at");