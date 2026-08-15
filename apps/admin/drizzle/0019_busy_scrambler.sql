ALTER TYPE "public"."staff_account_status" ADD VALUE 'invited' BEFORE 'active';--> statement-breakpoint
CREATE TABLE "staff_password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"requested_by_id" uuid,
	"status" "staff_invitation_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "staff_permissions" (
	"staff_account_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_permissions_staff_account_id_permission_id_pk" PRIMARY KEY("staff_account_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "staff_accounts" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_accounts" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_accounts" ADD COLUMN "role_label" text;--> statement-breakpoint
ALTER TABLE "staff_accounts" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff_accounts" ADD COLUMN "registered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff_invitations" ADD COLUMN "staff_account_id" uuid;--> statement-breakpoint
ALTER TABLE "staff_password_resets" ADD CONSTRAINT "staff_password_resets_staff_account_id_staff_accounts_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_password_resets" ADD CONSTRAINT "staff_password_resets_requested_by_id_staff_accounts_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_staff_account_id_staff_accounts_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_granted_by_id_staff_accounts_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."staff_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_password_resets_staff_status_idx" ON "staff_password_resets" USING btree ("staff_account_id","status");--> statement-breakpoint
CREATE INDEX "staff_permissions_permission_idx" ON "staff_permissions" USING btree ("permission_id");--> statement-breakpoint
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_staff_account_id_staff_accounts_id_fk" FOREIGN KEY ("staff_account_id") REFERENCES "public"."staff_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "staff_invitations_staff_status_idx" ON "staff_invitations" USING btree ("staff_account_id","status");
--> statement-breakpoint
INSERT INTO "staff_permissions" ("staff_account_id","permission_id","granted_by_id")
SELECT DISTINCT sr."staff_account_id", rp."permission_id", NULL::uuid
FROM "staff_roles" sr INNER JOIN "role_permissions" rp ON rp."role_id"=sr."role_id"
ON CONFLICT ("staff_account_id","permission_id") DO NOTHING;
--> statement-breakpoint
UPDATE "staff_accounts" sa SET "role_label"=source."name"
FROM (SELECT DISTINCT ON (sr."staff_account_id") sr."staff_account_id",r."name" FROM "staff_roles" sr INNER JOIN "roles" r ON r."id"=sr."role_id" ORDER BY sr."staff_account_id",r."name") source
WHERE sa."id"=source."staff_account_id" AND sa."role_label" IS NULL;
--> statement-breakpoint
INSERT INTO "permissions" ("key","display_name","description","module") VALUES
('staff.view','View Staff','View staff accounts and invitation status.','Staff'),
('staff.create','Invite Staff','Invite and resend staff registrations.','Staff'),
('staff.manage','Manage Staff','Edit staff labels and manage account lifecycle.','Staff'),
('staff.permissions','Manage Direct Staff Permissions','Assign permissions directly to staff accounts.','Staff'),
('staff.reset_password','Reset Staff Passwords','Send staff password reset links.','Staff')
ON CONFLICT ("key") DO NOTHING;
