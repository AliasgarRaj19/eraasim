CREATE TABLE "blog_page_configurations" (
	"id" text PRIMARY KEY NOT NULL,
	"draft" jsonb NOT NULL,
	"published" jsonb,
	"draft_version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone,
	"published_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_page_configurations" ADD CONSTRAINT "blog_page_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key", "display_name", "description", "module") VALUES
 ('pages.blog.view', 'View Blog Page', 'Open the fixed Blog Page CMS.', 'Pages'),
 ('pages.blog.edit', 'Edit Blog Page', 'Edit and save the Blog Page Draft.', 'Pages'),
 ('pages.blog.publish', 'Publish Blog Page', 'Publish Blog Page changes.', 'Pages')
ON CONFLICT ("key") DO NOTHING;
