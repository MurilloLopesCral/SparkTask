ALTER TYPE "public"."task_status" ADD VALUE IF NOT EXISTS 'pending_validation' BEFORE 'done';
