import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import type { RecurrenceFrequency } from './constants';

export type RecurrenceFormValues = {
	projectId: string;
	title: string;
	description: string;
	priority: string;
	type: string;
	kind: string;
	ownerId: string;
	frequency: RecurrenceFrequency;
	weekdaysOnly: boolean;
	weekDays: number[];
	dayOfMonth: number;
	startFrom: string;
	enabled?: boolean;
};

export async function createRecurrence(values: RecurrenceFormValues) {
	const res = await fetch('/api/recurrences', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			projectId: values.projectId,
			title: values.title,
			description: values.description || null,
			priority: values.priority,
			type: values.type,
			kind: values.kind,
			ownerId: values.ownerId || null,
			frequency: values.frequency,
			weekdaysOnly: values.weekdaysOnly,
			weekDays: values.weekDays,
			dayOfMonth: values.frequency === 'monthly' ? values.dayOfMonth : null,
			startFrom: values.startFrom || undefined
		})
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível criar a recorrência.');
		return false;
	}
	toast.success('Recorrência criada.');
	return true;
}

export async function updateRecurrence(id: string, values: RecurrenceFormValues) {
	const res = await fetch(`/api/recurrences/${id}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			projectId: values.projectId,
			title: values.title,
			description: values.description || null,
			priority: values.priority,
			type: values.type,
			kind: values.kind,
			ownerId: values.ownerId || null,
			frequency: values.frequency,
			weekdaysOnly: values.weekdaysOnly,
			weekDays: values.weekDays,
			dayOfMonth: values.frequency === 'monthly' ? values.dayOfMonth : null,
			startFrom: values.startFrom || undefined,
			enabled: values.enabled
		})
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível atualizar a recorrência.');
		return false;
	}
	toast.success('Recorrência atualizada. Alterações valem para ocorrências futuras.');
	return true;
}

export async function setRecurrenceEnabled(id: string, enabled: boolean) {
	const res = await fetch(`/api/recurrences/${id}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ enabled })
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível alterar a recorrência.');
		return false;
	}
	toast.success(enabled ? 'Recorrência retomada.' : 'Recorrência pausada.');
	return true;
}
