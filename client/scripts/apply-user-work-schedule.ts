/**
 * Applies user_work_schedule when drizzle-kit migrate/push isn't practical.
 *
 * Usage:
 *   npx tsx scripts/apply-user-work-schedule.ts
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url);

await sql`
	CREATE TABLE IF NOT EXISTS "user_work_schedule" (
		"user_id" uuid PRIMARY KEY NOT NULL,
		"enabled" boolean DEFAULT true NOT NULL,
		"timezone" varchar(64) DEFAULT 'America/Sao_Paulo' NOT NULL,
		"work_days" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
		"start_time" varchar(5) DEFAULT '08:00' NOT NULL,
		"end_time" varchar(5) DEFAULT '18:00' NOT NULL,
		"updated_at" timestamp with time zone DEFAULT now() NOT NULL
	)
`;

await sql.unsafe(`
	DO $$ BEGIN
		ALTER TABLE "user_work_schedule"
			ADD CONSTRAINT "user_work_schedule_user_id_user_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
			ON DELETE cascade ON UPDATE no action;
	EXCEPTION
		WHEN duplicate_object THEN NULL;
	END $$
`);

await sql`
	INSERT INTO "user_work_schedule" ("user_id")
	SELECT "id" FROM "user"
	ON CONFLICT ("user_id") DO NOTHING
`;

const check = await sql`
	select count(*)::int as n from "user_work_schedule"
`;
console.log('OK — user_work_schedule rows:', check[0]?.n ?? 0);
await sql.end();

function loadDotEnv() {
	try {
		const content = readFileSync('.env', 'utf8');
		for (const line of content.split('\n')) {
			const idx = line.indexOf('=');
			if (idx === -1) continue;
			const key = line.slice(0, idx).trim();
			if (!key || key.startsWith('#') || key in process.env) continue;
			process.env[key] = line
				.slice(idx + 1)
				.trim()
				.replace(/^"|"$/g, '');
		}
	} catch {
		// .env optional
	}
}
