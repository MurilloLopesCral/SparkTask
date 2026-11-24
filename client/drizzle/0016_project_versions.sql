CREATE TABLE "project_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"label" varchar(32) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 1 NOT NULL,
	"plexus_sync_enabled" boolean DEFAULT true NOT NULL,
	"implementation_start" date,
	"implementation_end" date,
	"assisted_ops_start" date,
	"assisted_ops_end" date,
	"performance_start" date,
	"performance_end" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);-->statement-breakpoint
ALTER TABLE "project_version" ADD CONSTRAINT "project_version_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;-->statement-breakpoint
CREATE UNIQUE INDEX "project_version_project_label_uidx" ON "project_version" ("project_id","label");-->statement-breakpoint
INSERT INTO "project_version" (
	"project_id",
	"label",
	"sort_order",
	"plexus_sync_enabled",
	"implementation_start",
	"implementation_end",
	"assisted_ops_start",
	"assisted_ops_end",
	"performance_start",
	"performance_end"
)
SELECT
	"id",
	'V1',
	1,
	true,
	"implementation_start",
	"implementation_end",
	"assisted_ops_start",
	"assisted_ops_end",
	"performance_start",
	"performance_end"
FROM "project";-->statement-breakpoint
ALTER TABLE "task" ADD COLUMN "project_version_id" uuid;-->statement-breakpoint
UPDATE "task" t
SET "project_version_id" = pv."id"
FROM "project_version" pv
WHERE pv."project_id" = t."project_id" AND pv."label" = 'V1';-->statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "project_version_id" SET NOT NULL;-->statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_project_version_id_project_version_id_fk" FOREIGN KEY ("project_version_id") REFERENCES "public"."project_version"("id") ON DELETE restrict ON UPDATE no action;-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "implementation_start";-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "implementation_end";-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "assisted_ops_start";-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "assisted_ops_end";-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "performance_start";-->statement-breakpoint
ALTER TABLE "project" DROP COLUMN "performance_end";
