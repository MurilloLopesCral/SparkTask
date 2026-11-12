CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'monthly');-->statement-breakpoint
CREATE TABLE "task_recurrence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"priority" "task_priority" NOT NULL,
	"type" "task_type" NOT NULL,
	"kind" "task_kind" DEFAULT 'improvement' NOT NULL,
	"owner_id" uuid,
	"created_by" uuid NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"weekdays_only" boolean DEFAULT false NOT NULL,
	"week_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"day_of_month" integer,
	"timezone" varchar(64) DEFAULT 'America/Sao_Paulo' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"next_due_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_id" uuid;-->statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_occurrence_date" date;-->statement-breakpoint
ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "task_recurrence" ADD CONSTRAINT "task_recurrence_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_recurrence_id_task_recurrence_id_fk" FOREIGN KEY ("recurrence_id") REFERENCES "public"."task_recurrence"("id") ON DELETE set null ON UPDATE no action;-->statement-breakpoint
CREATE UNIQUE INDEX "task_recurrence_occurrence_uidx" ON "task" ("recurrence_id","recurrence_occurrence_date") WHERE "recurrence_id" IS NOT NULL AND "recurrence_occurrence_date" IS NOT NULL;
