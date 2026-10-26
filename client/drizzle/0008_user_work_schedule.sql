CREATE TABLE "user_work_schedule" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Sao_Paulo' NOT NULL,
	"work_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"start_time" varchar(5) DEFAULT '08:00' NOT NULL,
	"end_time" varchar(5) DEFAULT '18:00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);-->statement-breakpoint
ALTER TABLE "user_work_schedule" ADD CONSTRAINT "user_work_schedule_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
INSERT INTO "user_work_schedule" ("user_id")
SELECT "id" FROM "user"
ON CONFLICT ("user_id") DO NOTHING;
