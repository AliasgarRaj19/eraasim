CREATE TABLE "about_page_configurations" (
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
ALTER TABLE "about_page_configurations" ADD CONSTRAINT "about_page_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('pages.about.view','View About CMS','View the About Draft configuration.','Pages'),
('pages.about.edit','Edit About CMS','Save the About Draft configuration and upload About media.','Pages'),
('pages.about.publish','Publish About CMS','Publish the About configuration.','Pages')
ON CONFLICT ("key") DO NOTHING;
