CREATE TYPE "public"."recurrence_due_offset_mode" AS ENUM('same_day', 'after_days', 'after_business_days');-->statement-breakpoint
ALTER TABLE "task_recurrence" ADD COLUMN "due_offset_mode" "recurrence_due_offset_mode" DEFAULT 'same_day' NOT NULL;-->statement-breakpoint
ALTER TABLE "task_recurrence" ADD COLUMN "due_offset_days" integer DEFAULT 0 NOT NULL;
