CREATE TABLE "theme_configurations" (
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
ALTER TABLE "theme_configurations" ADD CONSTRAINT "theme_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key", "display_name", "description", "module") VALUES
 ('theme.view', 'View Theme', 'Open the universal Theme CMS.', 'Theme'),
 ('theme.edit', 'Edit Theme', 'Edit and save the Theme Draft.', 'Theme'),
 ('theme.publish', 'Publish Theme', 'Publish Theme changes to the public site.', 'Theme')
ON CONFLICT ("key") DO NOTHING;
