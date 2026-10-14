/**
 * Applies task_execution schema when drizzle-kit migrate/push isn't practical
 * (e.g. no interactive TTY, or prod DATABASE_URL).
 *
 * Usage:
 *   npx tsx scripts/apply-task-execution.ts
 *   # or with another DB:
 *   $env:DATABASE_URL="postgres://..."; npx tsx scripts/apply-task-execution.ts
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url);

await sql`
	DO $$ BEGIN
		CREATE TYPE "public"."task_execution_end_reason" AS ENUM('paused', 'completed', 'auto_closed');
	EXCEPTION
		WHEN duplicate_object THEN NULL;
	END $$
`;

await sql`
	CREATE TABLE IF NOT EXISTS "task_execution" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
		"task_id" uuid NOT NULL,
		"user_id" uuid NOT NULL,
		"started_at" timestamp with time zone DEFAULT now() NOT NULL,
		"ended_at" timestamp with time zone,
		"end_reason" "task_execution_end_reason",
		"created_at" timestamp with time zone DEFAULT now() NOT NULL
	)
`;

await sql`
	DO $$ BEGIN
		ALTER TABLE "task_execution"
			ADD CONSTRAINT "task_execution_task_id_task_id_fk"
			FOREIGN KEY ("task_id") REFERENCES "public"."task"("id")
			ON DELETE cascade ON UPDATE no action;
	EXCEPTION
		WHEN duplicate_object THEN NULL;
	END $$
`;

await sql`
	DO $$ BEGIN
		ALTER TABLE "task_execution"
			ADD CONSTRAINT "task_execution_user_id_user_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
			ON DELETE cascade ON UPDATE no action;
	EXCEPTION
		WHEN duplicate_object THEN NULL;
	END $$
`;

const check = await sql`select to_regclass('public.task_execution') as t`;
console.log('OK — task_execution:', check[0]?.t);
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
