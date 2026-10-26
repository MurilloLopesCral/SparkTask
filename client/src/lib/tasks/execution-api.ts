import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { celebration } from './celebration.svelte';

type ExecutionAction = 'start' | 'pause' | 'finish';

export type TaskExecutionRow = {
	id: string;
	taskId: string;
	userId: string;
	startedAt: string | Date;
	endedAt: string | Date | null;
	endReason: 'paused' | 'completed' | 'auto_closed' | null;
	createdAt: string | Date;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
};

export async function fetchTaskExecutions(taskId: string): Promise<TaskExecutionRow[]> {
	const res = await fetch(`/api/tasks/${taskId}/execution`);
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível carregar as execuções.');
		return [];
	}
	const data = (await res.json()) as { executions: TaskExecutionRow[] };
	return data.executions ?? [];
}

async function postExecution(taskId: string, action: ExecutionAction) {
	const res = await fetch(`/api/tasks/${taskId}/execution`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ action })
	});
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível atualizar a execução.');
		return { ok: false as const, data };
	}
	return { ok: true as const, data };
}

export async function startTaskExecution(taskId: string) {
	const result = await postExecution(taskId, 'start');
	if (result.ok) toast.success('Execução iniciada.');
	return result.ok;
}

export async function pauseTaskExecution(taskId: string) {
	const result = await postExecution(taskId, 'pause');
	if (result.ok) toast.success('Execução pausada.');
	return result.ok;
}

export async function finishTaskExecution(taskId: string) {
	const result = await postExecution(taskId, 'finish');
	if (!result.ok) return false;

	if (result.data.status === 'done') {
		celebration.celebrate(taskId);
		toast.success('Validação concluída. Tarefa finalizada.');
	} else {
		toast.success('Execução encerrada. Tarefa em validação.');
	}
	return true;
}

/** Pause every open execution for the current user (end of day). */
export async function pauseAllTaskExecutions() {
	const res = await fetch('/api/executions/pause-all', { method: 'POST' });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível pausar as execuções.');
		return false;
	}

	const data = (await res.json().catch(() => ({}))) as { paused?: number };
	const paused = data.paused ?? 0;
	if (paused === 0) {
		toast.message('Nenhuma execução em andamento.');
	} else {
		toast.success(
			paused === 1 ? '1 execução pausada.' : `${paused} execuções pausadas.`
		);
	}
	return true;
}
