/**
 * Applies project.image when drizzle-kit migrate/push isn't practical.
 *
 * Usage:
 *   npx tsx scripts/apply-project-image.ts
 */
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

loadDotEnv();

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const sql = postgres(url);

await sql`
	ALTER TABLE "project"
	ADD COLUMN IF NOT EXISTS "image" text
`;

const check = await sql`
	select column_name, data_type
	from information_schema.columns
	where table_schema = 'public' and table_name = 'project' and column_name = 'image'
`;
console.log('OK — project.image:', check[0] ?? null);
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
