import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../src/lib/server/db/schema';

loadDotEnv();

const [name, email, password, groupName] = process.argv.slice(2);

if (!name || !email || !password || !groupName) {
	console.error(
		'Usage: npm run db:seed -- "Seu Nome" "voce@empresa.com" "senha-forte" "Nome do Grupo"'
	);
	process.exit(1);
}

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set (checked process.env and .env)');
	process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const passwordHash = await hashPassword(password);

await db.transaction(async (tx) => {
	const [createdUser] = await tx
		.insert(schema.user)
		.values({ name, email, emailVerified: true, isActive: true })
		.returning();

	// better-auth's credential provider stores the password hash on `account`,
	// not on `user` — accountId is conventionally the user id for this provider.
	await tx.insert(schema.account).values({
		accountId: createdUser.id,
		providerId: 'credential',
		issuer: 'local:credential',
		userId: createdUser.id,
		password: passwordHash
	});

	const [createdGroup] = await tx.insert(schema.group).values({ name: groupName }).returning();

	await tx.insert(schema.groupMember).values({
		groupId: createdGroup.id,
		memberId: createdUser.id,
		role: 'owner'
	});

	console.log(`✓ ${email} created as owner of group "${groupName}"`);
});

await sql.end();

function loadDotEnv() {
	try {
		const content = readFileSync(new URL('../.env', import.meta.url), 'utf8');
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
		// .env is optional if DATABASE_URL is already set in the environment
	}
}
