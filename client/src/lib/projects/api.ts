import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export interface CreateProjectValues {
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
			groupId: values.groupId
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

export interface ProjectFormValues {
	name: string;
	description: string;
}

export async function updateProject(projectId: string, values: ProjectFormValues) {
	const res = await fetch(`/api/projects/${projectId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ name: values.name, description: values.description || null })
	});
	await invalidateAll();

	if (!res.ok) {
		toast.error('Não foi possível salvar o projeto.');
		return false;
	}
	toast.success('Projeto atualizado.');
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
