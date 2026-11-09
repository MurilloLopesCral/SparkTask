import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { project, task } from '../db/schema';
import { finishExecution, pauseExecution, startExecution } from '../executions';
import { getGroupById } from '../groups';
import {
	createTask,
	updateTaskFields,
	userCanAccessProject,
	userCanAccessTask,
	userIsMemberOfProjectGroup
} from '../tasks';
import type { McpAuthContext } from './keys';
import { hasScope, type McpScope } from './scopes';

const TZ = sql.raw("'America/Sao_Paulo'");
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

type JsonSchema = Record<string, unknown>;

export type McpToolDefinition = {
	name: string;
	description: string;
	inputSchema: JsonSchema;
	requiredScope: McpScope | null;
};

export const MCP_TOOLS: McpToolDefinition[] = [
	{
		name: 'whoami',
		description: 'Retorna o usuário autenticado pela access key e o grupo ativo.',
		requiredScope: null,
		inputSchema: { type: 'object', properties: {}, additionalProperties: false }
	},
	{
		name: 'list_projects',
		description: 'Lista projetos ativos do grupo vinculado à chave.',
		requiredScope: 'projects:read',
		inputSchema: { type: 'object', properties: {}, additionalProperties: false }
	},
	{
		name: 'list_tasks',
		description:
			'Lista tarefas do grupo com filtros ricos para insights/relatórios. Todos os filtros aplicam no WHERE antes do limit. Datas em YYYY-MM-DD (fuso America/Sao_Paulo para updated/finished). Use dueBefore para atrasadas; mine:true = tarefas do usuário da chave.',
		requiredScope: 'tasks:read',
		inputSchema: {
			type: 'object',
			properties: {
				status: {
					type: 'array',
					items: {
						type: 'string',
						enum: [
							'not_started',
							'in_progress',
							'stand_by',
							'pending_validation',
							'done',
							'cancelled'
						]
					}
				},
				projectId: { type: 'string', format: 'uuid' },
				ownerId: { type: 'string', format: 'uuid' },
				mine: {
					type: 'boolean',
					description: 'Se true, filtra pelo usuário da access key (sobrescreve ownerId).'
				},
				search: { type: 'string', maxLength: 120 },
				updatedFrom: { type: 'string', description: 'YYYY-MM-DD' },
				updatedTo: { type: 'string', description: 'YYYY-MM-DD' },
				finishedFrom: { type: 'string', description: 'YYYY-MM-DD' },
				finishedTo: { type: 'string', description: 'YYYY-MM-DD' },
				dueBefore: {
					type: 'string',
					description: 'YYYY-MM-DD — prazo até esta data (útil para atrasadas).'
				},
				dueAfter: { type: 'string', description: 'YYYY-MM-DD — prazo a partir desta data.' },
				orderBy: {
					type: 'string',
					enum: ['updatedAt', 'dueDate', 'finishedAt'],
					default: 'updatedAt'
				},
				order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
				limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 }
			},
			additionalProperties: false
		}
	},
	{
		name: 'get_task',
		description: 'Detalha uma tarefa pelo id (incluindo projeto e responsável).',
		requiredScope: 'tasks:read',
		inputSchema: {
			type: 'object',
			properties: { taskId: { type: 'string', format: 'uuid' } },
			required: ['taskId'],
			additionalProperties: false
		}
	},
	{
		name: 'create_task',
		description: 'Cria uma tarefa em um projeto do grupo.',
		requiredScope: 'tasks:write',
		inputSchema: {
			type: 'object',
			properties: {
				projectId: { type: 'string', format: 'uuid' },
				title: { type: 'string', minLength: 1, maxLength: 255 },
				description: { type: 'string', maxLength: 8000 },
				priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
				type: { type: 'string', enum: ['mandatory', 'optional', 'desirable'] },
				kind: { type: 'string', enum: ['error', 'improvement'] },
				dueDate: { type: 'string', description: 'YYYY-MM-DD' },
				ownerId: { type: 'string', format: 'uuid' }
			},
			required: ['projectId', 'title', 'priority', 'type'],
			additionalProperties: false
		}
	},
	{
		name: 'update_task_status',
		description: 'Atualiza o status de uma tarefa.',
		requiredScope: 'tasks:write',
		inputSchema: {
			type: 'object',
			properties: {
				taskId: { type: 'string', format: 'uuid' },
				status: {
					type: 'string',
					enum: [
						'not_started',
						'in_progress',
						'stand_by',
						'pending_validation',
						'done',
						'cancelled'
					]
				}
			},
			required: ['taskId', 'status'],
			additionalProperties: false
		}
	},
	{
		name: 'start_execution',
		description: 'Inicia o timer de execução na tarefa (como o botão Iniciar no Spark).',
		requiredScope: 'executions:write',
		inputSchema: {
			type: 'object',
			properties: { taskId: { type: 'string', format: 'uuid' } },
			required: ['taskId'],
			additionalProperties: false
		}
	},
	{
		name: 'pause_execution',
		description: 'Pausa a execução em andamento e coloca a tarefa em stand_by.',
		requiredScope: 'executions:write',
		inputSchema: {
			type: 'object',
			properties: { taskId: { type: 'string', format: 'uuid' } },
			required: ['taskId'],
			additionalProperties: false
		}
	},
	{
		name: 'finish_execution',
		description:
			'Finaliza a execução: envia para pending_validation (ou done se já estiver em validação).',
		requiredScope: 'executions:write',
		inputSchema: {
			type: 'object',
			properties: { taskId: { type: 'string', format: 'uuid' } },
			required: ['taskId'],
			additionalProperties: false
		}
	}
];

function toolResult(data: unknown, isError = false) {
	return {
		content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
		isError
	};
}

function toolError(message: string) {
	return toolResult({ error: message }, true);
}

async function assertTaskInGroup(taskId: string, groupId: string, userId: string) {
	if (!(await userCanAccessTask(userId, taskId))) {
		return { ok: false as const, message: 'Tarefa não encontrada ou sem acesso.' };
	}

	const row = await db
		.select({ groupId: project.groupId })
		.from(task)
		.innerJoin(project, eq(project.id, task.projectId))
		.where(eq(task.id, taskId))
		.limit(1);

	if (!row[0] || row[0].groupId !== groupId) {
		return { ok: false as const, message: 'Tarefa fora do grupo desta chave.' };
	}
	return { ok: true as const };
}

async function projectIdsForGroup(groupId: string) {
	const rows = await db
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.groupId, groupId), eq(project.isActive, true)));
	return rows.map((r) => r.id);
}

const listTasksSchema = z.object({
	status: z
		.array(
			z.enum([
				'not_started',
				'in_progress',
				'stand_by',
				'pending_validation',
				'done',
				'cancelled'
			])
		)
		.optional(),
	projectId: z.string().uuid().optional(),
	ownerId: z.string().uuid().optional(),
	mine: z.boolean().optional(),
	search: z.string().max(120).optional(),
	updatedFrom: dateString.optional(),
	updatedTo: dateString.optional(),
	finishedFrom: dateString.optional(),
	finishedTo: dateString.optional(),
	dueBefore: dateString.optional(),
	dueAfter: dateString.optional(),
	orderBy: z.enum(['updatedAt', 'dueDate', 'finishedAt']).optional(),
	order: z.enum(['asc', 'desc']).optional(),
	limit: z.number().int().min(1).max(100).optional()
});

const createTaskSchema = z.object({
	projectId: z.string().uuid(),
	title: z.string().min(1).max(255),
	description: z.string().max(8000).optional(),
	priority: z.enum(['low', 'medium', 'high', 'critical']),
	type: z.enum(['mandatory', 'optional', 'desirable']),
	kind: z.enum(['error', 'improvement']).optional(),
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	ownerId: z.string().uuid().optional()
});

export async function callMcpTool(
	ctx: McpAuthContext,
	name: string,
	rawArgs: unknown
) {
	const def = MCP_TOOLS.find((t) => t.name === name);
	if (!def) return toolError(`Tool desconhecida: ${name}`);
	if (def.requiredScope && !hasScope(ctx.scopes, def.requiredScope)) {
		return toolError(`Escopo ausente: ${def.requiredScope}`);
	}

	const args = (rawArgs && typeof rawArgs === 'object' ? rawArgs : {}) as Record<
		string,
		unknown
	>;

	switch (name) {
		case 'whoami': {
			const group = await getGroupById(ctx.groupId);
			return toolResult({
				user: { id: ctx.userId, name: ctx.userName, email: ctx.userEmail },
				group: { id: ctx.groupId, name: group?.name ?? null },
				scopes: ctx.scopes,
				keyId: ctx.keyId
			});
		}
		case 'list_projects': {
			const projects = await db.query.project.findMany({
				where: and(eq(project.groupId, ctx.groupId), eq(project.isActive, true)),
				columns: {
					id: true,
					name: true,
					description: true,
					image: true,
					createdAt: true
				},
				orderBy: [desc(project.createdAt)]
			});
			return toolResult({ projects });
		}
		case 'list_tasks': {
			const parsed = listTasksSchema.safeParse(args);
			if (!parsed.success) return toolError('Argumentos inválidos para list_tasks.');
			const projectIds = await projectIdsForGroup(ctx.groupId);
			if (projectIds.length === 0) return toolResult({ tasks: [] });

			const conditions: SQL[] = [inArray(task.projectId, projectIds)];
			if (parsed.data.projectId) {
				if (!projectIds.includes(parsed.data.projectId)) {
					return toolError('projectId fora do grupo desta chave.');
				}
				conditions.push(eq(task.projectId, parsed.data.projectId));
			}
			if (parsed.data.status?.length) {
				conditions.push(inArray(task.status, parsed.data.status));
			}

			const ownerFilter = parsed.data.mine ? ctx.userId : parsed.data.ownerId;
			if (ownerFilter) conditions.push(eq(task.ownerId, ownerFilter));

			const search = parsed.data.search?.trim();
			if (search) {
				const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
				conditions.push(or(ilike(task.title, term), ilike(task.description, term))!);
			}

			if (parsed.data.updatedFrom) {
				conditions.push(
					gte(sql`((${task.updatedAt} AT TIME ZONE ${TZ})::date)`, parsed.data.updatedFrom)
				);
			}
			if (parsed.data.updatedTo) {
				conditions.push(
					lte(sql`((${task.updatedAt} AT TIME ZONE ${TZ})::date)`, parsed.data.updatedTo)
				);
			}
			if (parsed.data.finishedFrom) {
				conditions.push(
					gte(sql`((${task.finishedAt} AT TIME ZONE ${TZ})::date)`, parsed.data.finishedFrom)
				);
			}
			if (parsed.data.finishedTo) {
				conditions.push(
					lte(sql`((${task.finishedAt} AT TIME ZONE ${TZ})::date)`, parsed.data.finishedTo)
				);
			}
			if (parsed.data.dueAfter) conditions.push(gte(task.dueDate, parsed.data.dueAfter));
			if (parsed.data.dueBefore) conditions.push(lte(task.dueDate, parsed.data.dueBefore));

			const orderBy = parsed.data.orderBy ?? 'updatedAt';
			const orderDir = parsed.data.order ?? 'desc';
			const orderColumn =
				orderBy === 'dueDate'
					? task.dueDate
					: orderBy === 'finishedAt'
						? task.finishedAt
						: task.updatedAt;
			const orderExpr = orderDir === 'asc' ? asc(orderColumn) : desc(orderColumn);

			const rows = await db.query.task.findMany({
				where: and(...conditions),
				orderBy: [orderExpr],
				limit: parsed.data.limit ?? 30,
				columns: {
					id: true,
					title: true,
					description: true,
					status: true,
					priority: true,
					type: true,
					kind: true,
					dueDate: true,
					finishedAt: true,
					projectId: true,
					ownerId: true,
					updatedAt: true,
					createdAt: true
				},
				with: {
					project: { columns: { id: true, name: true } },
					owner: { columns: { id: true, name: true, email: true } }
				}
			});

			return toolResult({
				tasks: rows,
				meta: {
					count: rows.length,
					limit: parsed.data.limit ?? 30,
					orderBy,
					order: orderDir,
					filters: {
						ownerId: ownerFilter ?? null,
						mine: parsed.data.mine ?? false,
						updatedFrom: parsed.data.updatedFrom ?? null,
						updatedTo: parsed.data.updatedTo ?? null,
						finishedFrom: parsed.data.finishedFrom ?? null,
						finishedTo: parsed.data.finishedTo ?? null,
						dueBefore: parsed.data.dueBefore ?? null,
						dueAfter: parsed.data.dueAfter ?? null
					}
				}
			});
		}
		case 'get_task': {
			const taskId = typeof args.taskId === 'string' ? args.taskId : '';
			const gate = await assertTaskInGroup(taskId, ctx.groupId, ctx.userId);
			if (!gate.ok) return toolError(gate.message);

			const row = await db.query.task.findFirst({
				where: eq(task.id, taskId),
				with: {
					project: { columns: { id: true, name: true, groupId: true } },
					owner: { columns: { id: true, name: true, email: true } },
					creator: { columns: { id: true, name: true, email: true } }
				}
			});
			return toolResult({ task: row });
		}
		case 'create_task': {
			const parsed = createTaskSchema.safeParse(args);
			if (!parsed.success) return toolError('Argumentos inválidos para create_task.');
			if (!(await userCanAccessProject(ctx.userId, parsed.data.projectId))) {
				return toolError('Projeto sem acesso.');
			}
			const [proj] = await db
				.select({ groupId: project.groupId })
				.from(project)
				.where(eq(project.id, parsed.data.projectId))
				.limit(1);
			if (!proj || proj.groupId !== ctx.groupId) {
				return toolError('Projeto fora do grupo desta chave.');
			}
			if (parsed.data.ownerId) {
				const okOwner = await userIsMemberOfProjectGroup(
					parsed.data.ownerId,
					parsed.data.projectId
				);
				if (!okOwner) return toolError('ownerId não pertence ao grupo do projeto.');
			}

			const created = await createTask({
				title: parsed.data.title,
				description: parsed.data.description ?? null,
				projectId: parsed.data.projectId,
				priority: parsed.data.priority,
				type: parsed.data.type,
				kind: parsed.data.kind ?? 'improvement',
				dueDate: parsed.data.dueDate ?? null,
				ownerId: parsed.data.ownerId ?? ctx.userId,
				createdBy: ctx.userId
			});
			return toolResult({ task: created });
		}
		case 'update_task_status': {
			const taskId = typeof args.taskId === 'string' ? args.taskId : '';
			const status = typeof args.status === 'string' ? args.status : '';
			const gate = await assertTaskInGroup(taskId, ctx.groupId, ctx.userId);
			if (!gate.ok) return toolError(gate.message);
			const allowed = [
				'not_started',
				'in_progress',
				'stand_by',
				'pending_validation',
				'done',
				'cancelled'
			] as const;
			if (!allowed.includes(status as (typeof allowed)[number])) {
				return toolError('Status inválido.');
			}
			await updateTaskFields(taskId, {
				status: status as (typeof allowed)[number]
			});
			return toolResult({ ok: true, taskId, status });
		}
		case 'start_execution': {
			const taskId = typeof args.taskId === 'string' ? args.taskId : '';
			const gate = await assertTaskInGroup(taskId, ctx.groupId, ctx.userId);
			if (!gate.ok) return toolError(gate.message);
			const result = await startExecution(taskId, ctx.userId);
			if (!result.ok) return toolError(result.message);
			return toolResult({ ok: true, execution: result.execution });
		}
		case 'pause_execution': {
			const taskId = typeof args.taskId === 'string' ? args.taskId : '';
			const gate = await assertTaskInGroup(taskId, ctx.groupId, ctx.userId);
			if (!gate.ok) return toolError(gate.message);
			const result = await pauseExecution(taskId, ctx.userId);
			if (!result.ok) return toolError(result.message);
			return toolResult({ ok: true, execution: result.execution });
		}
		case 'finish_execution': {
			const taskId = typeof args.taskId === 'string' ? args.taskId : '';
			const gate = await assertTaskInGroup(taskId, ctx.groupId, ctx.userId);
			if (!gate.ok) return toolError(gate.message);
			const result = await finishExecution(taskId, ctx.userId);
			if (!result.ok) return toolError(result.message);
			return toolResult({
				ok: true,
				execution: result.execution,
				status: result.status
			});
		}
		default:
			return toolError(`Tool não implementada: ${name}`);
	}
}
