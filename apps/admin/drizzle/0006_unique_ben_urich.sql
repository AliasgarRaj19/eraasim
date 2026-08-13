CREATE TABLE "footer_configurations" (
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
ALTER TABLE "footer_configurations" ADD CONSTRAINT "footer_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key", "display_name", "description", "module") VALUES
 ('footer.view', 'View Footer', 'Open the universal Footer CMS.', 'Footer'),
 ('footer.edit', 'Edit Footer', 'Edit and save the Footer Draft.', 'Footer'),
 ('footer.publish', 'Publish Footer', 'Publish Footer changes to the public site.', 'Footer')
ON CONFLICT ("key") DO NOTHING;
