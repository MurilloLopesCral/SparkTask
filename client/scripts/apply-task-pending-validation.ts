/**
 * Adds task_status.pending_validation when drizzle-kit migrate/push isn't practical.
 *
 * Usage:
 *   npx tsx scripts/apply-task-pending-validation.ts
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url);

await sql.unsafe(`
	ALTER TYPE "public"."task_status"
	ADD VALUE IF NOT EXISTS 'pending_validation' BEFORE 'done'
`);

const check = await sql`
	select enumlabel
	from pg_enum
	join pg_type on pg_enum.enumtypid = pg_type.oid
	where pg_type.typname = 'task_status'
	order by enumsortorder
`;
console.log(
	'OK — task_status:',
	check.map((r) => r.enumlabel).join(', ')
);
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
