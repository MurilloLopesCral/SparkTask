ALTER TABLE "project" ADD COLUMN "plexus_project_id" varchar(64);-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "implementation_start" date;-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "implementation_end" date;-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "assisted_ops_start" date;-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "assisted_ops_end" date;-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "performance_start" date;-->statement-breakpoint
ALTER TABLE "project" ADD COLUMN "performance_end" date;-->statement-breakpoint
CREATE UNIQUE INDEX "project_plexus_project_id_uidx" ON "project" ("plexus_project_id") WHERE "plexus_project_id" IS NOT NULL;
