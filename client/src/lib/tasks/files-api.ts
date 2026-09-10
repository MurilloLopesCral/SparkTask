import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export interface FileUploadConfig {
	allowedExtensions: string[];
	maxFileSizeBytes: number;
}

export async function uploadTaskFile(taskId: string, file: File) {
	const form = new FormData();
	form.set('file', file);

	const res = await fetch(`/api/tasks/${taskId}/files`, { method: 'POST', body: form });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível enviar o arquivo.');
		return false;
	}
	toast.success('Arquivo anexado.');
	return true;
}

/** Forces Cloudinary to send Content-Disposition: attachment instead of rendering inline. */
export function taskFileDownloadUrl(assetUrl: string) {
	return assetUrl.includes('?')
		? `${assetUrl}&fl_attachment=true`
		: `${assetUrl}?fl_attachment=true`;
}

export async function removeTaskFile(fileId: string) {
	const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível excluir o arquivo.');
		return false;
	}
	toast.success('Arquivo excluído.');
	return true;
}
