import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { celebration } from './celebration.svelte';

type ExecutionAction = 'start' | 'pause' | 'finish';

async function postExecution(taskId: string, action: ExecutionAction) {
	const res = await fetch(`/api/tasks/${taskId}/execution`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ action })
	});
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível atualizar a execução.');
		return false;
	}
	return true;
}

export async function startTaskExecution(taskId: string) {
	const ok = await postExecution(taskId, 'start');
	if (ok) toast.success('Execução iniciada.');
	return ok;
}

export async function pauseTaskExecution(taskId: string) {
	const ok = await postExecution(taskId, 'pause');
	if (ok) toast.success('Execução pausada.');
	return ok;
}

export async function finishTaskExecution(taskId: string) {
	const ok = await postExecution(taskId, 'finish');
	if (ok) {
		celebration.celebrate(taskId);
		toast.success('Tarefa finalizada.');
	}
	return ok;
}
