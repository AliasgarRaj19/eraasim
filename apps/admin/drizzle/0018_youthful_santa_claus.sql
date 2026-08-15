CREATE TABLE "activity_log_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"retention_months" integer DEFAULT 3 NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_log_settings_retention_chk" CHECK ("activity_log_settings"."retention_months" IN (3, 6, 12))
);
--> statement-breakpoint
ALTER TABLE "activity_log_settings" ADD CONSTRAINT "activity_log_settings_updated_by_id_staff_accounts_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_created_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_action_created_idx" ON "activity_logs" USING btree ("action","created_at");
--> statement-breakpoint
INSERT INTO "activity_log_settings" ("id", "retention_months") VALUES ('global', 3) ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('logs.view','View Activity Logs','View application activity and audit logs.','Logs'),
('logs.export','Export Activity Logs','Export sanitized activity logs for a bounded date range.','Logs'),
('logs.settings','Manage Activity Log Settings','Manage activity-log retention settings.','Logs')
ON CONFLICT ("key") DO NOTHING;
