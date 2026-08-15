CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed');--> statement-breakpoint
CREATE TABLE "careers_page_configurations" (
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
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"description" jsonb NOT NULL,
	"location" text,
	"employment_type" text,
	"department" text,
	"experience" text,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"created_by_id" uuid NOT NULL,
	"updated_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "careers_page_configurations" ADD CONSTRAINT "careers_page_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_id_staff_accounts_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_slug_uidx" ON "jobs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "jobs_status_published_idx" ON "jobs" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "jobs_deleted_at_idx" ON "jobs" USING btree ("deleted_at");
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('pages.careers.view','View Careers CMS','View the Careers Draft configuration.','Pages'),
('pages.careers.edit','Edit Careers CMS','Save Careers Draft configuration.','Pages'),
('pages.careers.publish','Publish Careers CMS','Publish Careers configuration.','Pages'),
('jobs.view','View Jobs','View Job Opportunities.','Jobs'),
('jobs.create','Create Jobs','Create Job Opportunities.','Jobs'),
('jobs.edit','Edit Jobs','Edit Job Opportunities.','Jobs'),
('jobs.publish','Publish Jobs','Publish, close, and reopen Job Opportunities.','Jobs'),
('jobs.delete','Delete Jobs','Soft delete and restore Job Opportunities.','Jobs')
ON CONFLICT ("key") DO NOTHING;
