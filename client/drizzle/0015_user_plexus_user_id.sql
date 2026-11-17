ALTER TABLE "user" ADD COLUMN "plexus_user_id" integer;-->statement-breakpoint
CREATE UNIQUE INDEX "user_plexus_user_id_uidx" ON "user" ("plexus_user_id") WHERE "plexus_user_id" IS NOT NULL;
