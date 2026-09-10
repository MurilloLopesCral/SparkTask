import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';

loadDotEnv();

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set (checked process.env and .env)');
	process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const [firstGroup] = await db.select().from(schema.group).limit(1);
if (!firstGroup) {
	console.error('No group found — run `npm run db:seed` first.');
	process.exit(1);
}

const [owner] = await db
	.select()
	.from(schema.groupMember)
	.where(eq(schema.groupMember.groupId, firstGroup.id))
	.limit(1);
if (!owner) {
	console.error(`Group "${firstGroup.name}" has no members.`);
	process.exit(1);
}

const [demoProject] = await db
	.insert(schema.project)
	.values({
		name: 'Demo',
		description: 'Projeto de teste gerado pelo seed.',
		groupId: firstGroup.id
	})
	.returning();

const now = Date.now();
const hours = (n: number) => new Date(now - n * 60 * 60 * 1000);

const sampleTasks: (typeof schema.task.$inferInsert)[] = [
	{
		title: 'Configurar ambiente de staging',
		description: 'Provisionar banco e variáveis de ambiente para o ambiente de homologação.',
		projectId: demoProject.id,
		priority: 'high',
		type: 'mandatory',
		status: 'not_started',
		ownerId: owner.memberId,
		createdBy: owner.memberId,
		createdAt: hours(1)
	},
	{
		title: 'Revisar copy da landing page',
		projectId: demoProject.id,
		priority: 'low',
		type: 'optional',
		status: 'not_started',
		createdBy: owner.memberId,
		createdAt: hours(30)
	},
	{
		title: 'Implementar filtro por responsável',
		description: 'Adicionar filtro na tabela de tarefas por usuário responsável.',
		projectId: demoProject.id,
		priority: 'medium',
		type: 'desirable',
		status: 'in_progress',
		ownerId: owner.memberId,
		createdBy: owner.memberId,
		createdAt: hours(5)
	},
	{
		title: 'Corrigir bug de sessão expirada',
		projectId: demoProject.id,
		priority: 'critical',
		type: 'mandatory',
		status: 'in_progress',
		ownerId: owner.memberId,
		createdBy: owner.memberId,
		createdAt: hours(50)
	},
	{
		title: 'Aguardando aprovação do design',
		projectId: demoProject.id,
		priority: 'medium',
		type: 'mandatory',
		status: 'stand_by',
		createdBy: owner.memberId,
		createdAt: hours(10)
	},
	{
		title: 'Migrar tabela de convites',
		projectId: demoProject.id,
		priority: 'high',
		type: 'mandatory',
		status: 'done',
		ownerId: owner.memberId,
		createdBy: owner.memberId,
		dueDate: new Date().toISOString().slice(0, 10),
		createdAt: hours(80)
	},
	{
		title: 'Testar fluxo de convite por e-mail',
		projectId: demoProject.id,
		priority: 'medium',
		type: 'mandatory',
		status: 'done',
		ownerId: owner.memberId,
		createdBy: owner.memberId,
		createdAt: hours(100)
	},
	{
		title: 'Avaliar biblioteca de gráficos descartada',
		projectId: demoProject.id,
		priority: 'low',
		type: 'optional',
		status: 'cancelled',
		createdBy: owner.memberId,
		createdAt: hours(200)
	}
];

await db.insert(schema.task).values(sampleTasks);

console.log(`✓ Project "${demoProject.name}" created with ${sampleTasks.length} tasks.`);

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
