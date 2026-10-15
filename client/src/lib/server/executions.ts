import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { db } from './db';
import { task, taskExecution, type taskExecutionEndReasonEnum } from './db/schema';

export type ExecutionEndReason = (typeof taskExecutionEndReasonEnum.enumValues)[number];

export async function listTaskExecutions(taskId: string) {
	return db.query.taskExecution.findMany({
		where: eq(taskExecution.taskId, taskId),
		orderBy: [desc(taskExecution.startedAt)],
		with: {
			user: {
				columns: { id: true, name: true, email: true, image: true }
			}
		}
	});
}

export async function getOpenExecution(taskId: string, userId: string) {
	const [row] = await db
		.select({
			id: taskExecution.id,
			startedAt: taskExecution.startedAt,
			userId: taskExecution.userId
		})
		.from(taskExecution)
		.where(
			and(
				eq(taskExecution.taskId, taskId),
				eq(taskExecution.userId, userId),
				isNull(taskExecution.endedAt)
			)
		)
		.orderBy(desc(taskExecution.startedAt))
		.limit(1);

	return row ?? null;
}

export async function startExecution(taskId: string, userId: string) {
	const [row] = await db
		.select({ status: task.status })
		.from(task)
		.where(eq(task.id, taskId))
		.limit(1);

	if (!row) return { ok: false as const, message: 'Tarefa não encontrada.', status: 404 };
	if (
		row.status === 'done' ||
		row.status === 'cancelled' ||
		row.status === 'pending_validation'
	) {
		return {
			ok: false as const,
			message:
				'Não é possível executar uma tarefa em validação, finalizada ou cancelada.',
			status: 400
		};
	}

	const open = await getOpenExecution(taskId, userId);
	if (open) {
		return { ok: false as const, message: 'Já existe uma execução em andamento.', status: 409 };
	}

	const [created] = await db
		.insert(taskExecution)
		.values({ taskId, userId })
		.returning({
			id: taskExecution.id,
			startedAt: taskExecution.startedAt,
			userId: taskExecution.userId
		});

	if (row.status !== 'in_progress') {
		await db
			.update(task)
			.set({ status: 'in_progress', updatedAt: new Date() })
			.where(eq(task.id, taskId));
	}

	return { ok: true as const, execution: created };
}

async function closeOpenExecution(
	taskId: string,
	userId: string,
	endReason: ExecutionEndReason
) {
	const open = await getOpenExecution(taskId, userId);
	if (!open) return null;

	const endedAt = new Date();
	await db
		.update(taskExecution)
		.set({ endedAt, endReason })
		.where(eq(taskExecution.id, open.id));

	return { ...open, endedAt, endReason };
}

/** Closes every open execution on the task (any user) — used when status → done/cancelled. */
export async function autoCloseOpenExecutions(taskId: string) {
	const endedAt = new Date();
	await db
		.update(taskExecution)
		.set({ endedAt, endReason: 'auto_closed' })
		.where(and(eq(taskExecution.taskId, taskId), isNull(taskExecution.endedAt)));
}

export async function pauseExecution(taskId: string, userId: string) {
	const closed = await closeOpenExecution(taskId, userId, 'paused');
	if (!closed) {
		return { ok: false as const, message: 'Nenhuma execução em andamento.', status: 404 };
	}

	await db
		.update(task)
		.set({ status: 'stand_by', updatedAt: new Date() })
		.where(eq(task.id, taskId));

	return { ok: true as const, execution: closed };
}

/** Pause every open execution for a user (end-of-day bulk stop). */
export async function pauseAllOpenExecutionsForUser(userId: string) {
	const open = await db
		.select({
			id: taskExecution.id,
			taskId: taskExecution.taskId
		})
		.from(taskExecution)
		.where(and(eq(taskExecution.userId, userId), isNull(taskExecution.endedAt)));

	if (open.length === 0) {
		return { paused: 0, taskIds: [] as string[] };
	}

	const endedAt = new Date();
	const ids = open.map((row) => row.id);
	const taskIds = [...new Set(open.map((row) => row.taskId))];

	await db
		.update(taskExecution)
		.set({ endedAt, endReason: 'paused' })
		.where(inArray(taskExecution.id, ids));

	await db
		.update(task)
		.set({ status: 'stand_by', updatedAt: endedAt })
		.where(inArray(task.id, taskIds));

	return { paused: open.length, taskIds };
}

/**
 * Ends the work session and moves the task to validation (not done yet).
 * Closes open timers — same affordance as pause, different target status.
 */
export async function finishExecution(taskId: string, userId: string) {
	const [row] = await db
		.select({ status: task.status })
		.from(task)
		.where(eq(task.id, taskId))
		.limit(1);

	if (!row) return { ok: false as const, message: 'Tarefa não encontrada.', status: 404 };
	if (row.status === 'done' || row.status === 'cancelled') {
		return {
			ok: false as const,
			message: 'A tarefa já está finalizada ou cancelada.',
			status: 400
		};
	}
	if (row.status === 'pending_validation') {
		return {
			ok: false as const,
			message: 'A tarefa já está em validação.',
			status: 400
		};
	}

	const closed = await closeOpenExecution(taskId, userId, 'completed');
	// Finishing without an open timer is allowed — still sends to validation.
	await autoCloseOpenExecutions(taskId);

	await db
		.update(task)
		.set({ status: 'pending_validation', updatedAt: new Date() })
		.where(eq(task.id, taskId));

	return { ok: true as const, execution: closed };
}
