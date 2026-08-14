CREATE TYPE "public"."contact_message_status" AS ENUM('new', 'read', 'replied', 'archived');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" "contact_message_status" DEFAULT 'new' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"notification_sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contact_page_configurations" (
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
ALTER TABLE "contact_page_configurations" ADD CONSTRAINT "contact_page_configurations_published_by_id_staff_accounts_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_messages_submitted_idx" ON "contact_messages" USING btree ("submitted_at");
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('pages.contact.view','View Contact Us CMS','View Contact Us Draft configuration.','Pages'),
('pages.contact.edit','Edit Contact Us CMS','Save Contact Us Draft configuration.','Pages'),
('pages.contact.publish','Publish Contact Us CMS','Publish Contact Us configuration.','Pages'),
('contact.messages.view','View Contact Messages','View the Contact Messages inbox and message details.','Contact'),
('contact.messages.manage','Manage Contact Messages','Change Contact Message status.','Contact')
ON CONFLICT ("key") DO NOTHING;
