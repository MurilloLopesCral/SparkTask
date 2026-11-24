import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import {
	lifecyclePayload,
	plexusPayload,
	type ProjectLifecycleForm,
	type ProjectPlexusForm
} from './lifecycle';

export interface CreateProjectValues extends ProjectLifecycleForm {
	name: string;
	description: string;
	groupId: string;
}

export async function createProject(values: CreateProjectValues) {
	const res = await fetch('/api/projects', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			name: values.name,
			description: values.description || undefined,
			groupId: values.groupId,
			...lifecyclePayload(values)
		})
	});
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível criar o projeto.');
		return { ok: false as const, project: null };
	}

	toast.success('Projeto criado.');
	return {
		ok: true as const,
		project: data.project as { id: string; name: string; image: string | null }
	};
}

export interface ProjectFormValues extends ProjectPlexusForm {
	name: string;
	description: string;
}

export async function updateProject(projectId: string, values: ProjectFormValues) {
	const res = await fetch(`/api/projects/${projectId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			name: values.name,
			description: values.description || null,
			...plexusPayload(values)
		})
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível salvar o projeto.');
		return false;
	}
	toast.success('Projeto atualizado.');
	return true;
}

export async function createProjectVersion(projectId: string) {
	const res = await fetch(`/api/projects/${projectId}/versions`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({})
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível criar a versão.');
		return null;
	}
	toast.success(`Versão ${data.version?.label ?? ''} criada.`);
	return data.version as { id: string; label: string };
}

export async function updateProjectVersion(
	projectId: string,
	versionId: string,
	fields: {
		description?: string | null;
		implementationStart?: string | null;
		implementationEnd?: string | null;
		assistedOpsStart?: string | null;
		assistedOpsEnd?: string | null;
		performanceStart?: string | null;
		performanceEnd?: string | null;
		plexusSyncEnabled?: boolean;
	}
) {
	const res = await fetch(`/api/projects/${projectId}/versions/${versionId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(fields)
	});
	await invalidateAll();
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível salvar a versão.');
		return false;
	}
	toast.success('Versão atualizada.');
	return true;
}

export async function uploadProjectImage(
	projectId: string,
	file: File,
	options: { quiet?: boolean } = {}
) {
	const form = new FormData();
	form.set('file', file);

	const res = await fetch(`/api/projects/${projectId}/image`, { method: 'POST', body: form });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível enviar a imagem do projeto.');
		return false;
	}
	if (!options.quiet) toast.success('Imagem do projeto atualizada.');
	return true;
}

export async function clearProjectImage(projectId: string, options: { quiet?: boolean } = {}) {
	const res = await fetch(`/api/projects/${projectId}/image`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		toast.error('Não foi possível remover a imagem do projeto.');
		return false;
	}
	if (!options.quiet) toast.success('Imagem do projeto removida.');
	return true;
}

export async function removeProject(projectId: string) {
	const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		toast.error('Não foi possível excluir o projeto.');
		return;
	}
	toast.success('Projeto excluído.');
}

export type PlexusProjectSyncSummary = {
	total: number;
	created: number;
	updated: number;
	skipped: number;
	failed: number;
	skipReasons: {
		noOwnerPlexus: number;
		noProjectLink: number;
		notConfigured: number;
	};
};

/** Owner-only retroactive sync of project tasks → Plexus gantts. */
export async function syncProjectToPlexus(projectId: string) {
	const res = await fetch(`/api/projects/${projectId}/plexus-sync`, { method: 'POST' });
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível sincronizar com o Plexus.');
		return null;
	}

	const summary = data.summary as PlexusProjectSyncSummary;
	const parts = [
		`${summary.created} criados`,
		`${summary.updated} atualizados`,
		`${summary.skipped} ignorados`,
		`${summary.failed} falhas`
	];
	toast.success(`Sync Plexus: ${parts.join(' · ')} (${summary.total} tarefas).`);
	return summary;
}
