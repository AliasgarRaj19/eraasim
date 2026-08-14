ALTER TABLE "categories" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "featured_post_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_featured_post_id_posts_id_fk" FOREIGN KEY ("featured_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;