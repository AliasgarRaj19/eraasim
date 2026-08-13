CREATE TABLE "header_configurations" (
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
ALTER TABLE "header_configurations" ADD CONSTRAINT "header_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key", "display_name", "description", "module") VALUES
  ('header.view', 'View Header', 'Open the universal Header CMS.', 'Header'),
  ('header.edit', 'Edit Header', 'Edit and save the Header Draft.', 'Header'),
  ('header.publish', 'Publish Header', 'Publish Header changes to the public site.', 'Header')
ON CONFLICT ("key") DO NOTHING;
