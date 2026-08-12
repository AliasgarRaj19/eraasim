CREATE TABLE "post_daily_views" (
	"post_id" uuid NOT NULL,
	"view_date" date NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "post_daily_views_post_id_view_date_pk" PRIMARY KEY("post_id","view_date"),
	CONSTRAINT "post_daily_views_nonnegative_chk" CHECK ("post_daily_views"."view_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "post_daily_views" ADD CONSTRAINT "post_daily_views_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_daily_views_date_count_idx" ON "post_daily_views" USING btree ("view_date","view_count");