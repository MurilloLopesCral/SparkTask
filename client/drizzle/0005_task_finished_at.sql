ALTER TABLE "task" ADD COLUMN "finished_at" timestamp with time zone;-->statement-breakpoint
UPDATE "task" SET "finished_at" = "updated_at" WHERE "status" = 'done' AND "finished_at" IS NULL;
