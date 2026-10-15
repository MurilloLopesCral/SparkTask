/**
 * Applies task.finished_at when drizzle-kit migrate/push isn't practical.
 *
 * Usage:
 *   npx tsx scripts/apply-task-finished-at.ts
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url);

await sql`
	ALTER TABLE "task"
	ADD COLUMN IF NOT EXISTS "finished_at" timestamp with time zone
`;

await sql`
	UPDATE "task"
	SET "finished_at" = "updated_at"
	WHERE "status" = 'done' AND "finished_at" IS NULL
`;

const check = await sql`
	select column_name, data_type
	from information_schema.columns
	where table_schema = 'public' and table_name = 'task' and column_name = 'finished_at'
`;
console.log('OK — task.finished_at:', check[0] ?? null);
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
