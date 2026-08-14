CREATE TYPE "public"."generic_page_status" AS ENUM('draft', 'published', 'unpublished');--> statement-breakpoint
CREATE TABLE "generic_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"status" "generic_page_status" DEFAULT 'draft' NOT NULL,
	"content" jsonb NOT NULL,
	"featured_image_path" text,
	"featured_image_alt" text,
	"seo_title" text,
	"seo_description" text,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_by_id" uuid NOT NULL,
	"updated_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generic_pages" ADD CONSTRAINT "generic_pages_created_by_id_staff_accounts_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generic_pages" ADD CONSTRAINT "generic_pages_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "generic_pages_slug_uidx" ON "generic_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "generic_pages_status_idx" ON "generic_pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "generic_pages_deleted_at_idx" ON "generic_pages" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "generic_pages_published_at_idx" ON "generic_pages" USING btree ("published_at");
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('pages.generic.view','View Generic Pages','View generic Pages and their lifecycle.','Pages'),
('pages.generic.create','Create Generic Pages','Create generic Pages.','Pages'),
('pages.generic.edit','Edit Generic Pages','Edit generic Page content.','Pages'),
('pages.generic.publish','Publish Generic Pages','Publish and unpublish generic Pages.','Pages'),
('pages.generic.delete','Delete Generic Pages','Soft delete, restore, and permanently delete generic Pages.','Pages')
ON CONFLICT ("key") DO NOTHING;
