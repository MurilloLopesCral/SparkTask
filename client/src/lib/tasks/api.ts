import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { celebration } from './celebration.svelte';
import type { TaskStatus } from './constants';

async function patchTask(taskId: string, fields: Record<string, unknown>) {
	const res = await fetch(`/api/tasks/${taskId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(fields)
	});
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível atualizar a tarefa.');
		return false;
	}
	if (fields.status === 'done') celebration.celebrate(taskId);
	return true;
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
	const ok = await patchTask(taskId, { status });
	if (ok) toast.success('Status atualizado.');
	return ok;
}

export async function setTaskOwner(taskId: string, ownerId: string | null) {
	const ok = await patchTask(taskId, { ownerId });
	if (ok) toast.success(ownerId ? 'Responsável atualizado.' : 'Responsável removido.');
	return ok;
}

export async function removeTask(taskId: string) {
	const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		toast.error('Não foi possível excluir a tarefa.');
		return;
	}
	toast.success('Tarefa excluída.');
}

export interface TaskFormValues {
	title: string;
	description: string;
	status: string;
	priority: string;
	type: string;
	kind: string;
	dueDate: string;
	ownerId: string;
	projectId: string;
}

export async function saveTask(taskId: string, values: TaskFormValues) {
	const ok = await patchTask(taskId, {
		title: values.title,
		description: values.description || null,
		status: values.status,
		priority: values.priority,
		type: values.type,
		kind: values.kind,
		dueDate: values.dueDate || null,
		ownerId: values.ownerId || null,
		projectId: values.projectId
	});
	if (ok) toast.success('Tarefa atualizada.');
	return ok;
}

/** Persist only the description (e.g. toggling markdown todos). No success toast. */
export async function saveTaskDescription(taskId: string, description: string) {
	return patchTask(taskId, { description: description || null });
}

export interface CreateTaskValues {
	title: string;
	description: string;
	projectId: string;
	priority: string;
	type: string;
	kind: string;
	dueDate: string;
	ownerId: string;
}

export async function createTask(values: CreateTaskValues) {
	const res = await fetch('/api/tasks', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			title: values.title,
			description: values.description || undefined,
			projectId: values.projectId,
			priority: values.priority,
			type: values.type,
			kind: values.kind,
			dueDate: values.dueDate || undefined,
			ownerId: values.ownerId || undefined
		})
	});
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível criar a tarefa.');
	} else {
		toast.success('Tarefa criada.');
	}
	return res;
}
