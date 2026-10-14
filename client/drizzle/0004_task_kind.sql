CREATE TYPE "public"."task_kind" AS ENUM('error', 'improvement');-->statement-breakpoint
ALTER TABLE "task" ADD COLUMN "kind" "task_kind" DEFAULT 'improvement' NOT NULL;
