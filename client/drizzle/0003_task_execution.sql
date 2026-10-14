CREATE TYPE "public"."task_execution_end_reason" AS ENUM('paused', 'completed', 'auto_closed');-->statement-breakpoint
CREATE TABLE "task_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"end_reason" "task_execution_end_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
-->statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
