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

export function isImageAttachment(file: { resourceType: string; name?: string }) {
	if (file.resourceType === 'image') return true;
	const ext = file.name?.split('.').pop()?.toLowerCase() ?? '';
	return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'].includes(ext);
}

async function blobAsPng(blob: Blob): Promise<Blob> {
	if (blob.type === 'image/png') return blob;

	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas indisponível.');
	ctx.drawImage(bitmap, 0, 0);
	bitmap.close();

	const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!png) throw new Error('Falha ao converter imagem.');
	return png;
}

/** Copy an attachment image to the system clipboard (as PNG). */
export async function copyTaskImageToClipboard(assetUrl: string) {
	if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
		toast.error('Seu navegador não permite copiar imagens.');
		return false;
	}

	try {
		const res = await fetch(assetUrl);
		if (!res.ok) throw new Error('fetch failed');
		const png = await blobAsPng(await res.blob());
		await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
		toast.success('Imagem copiada.');
		return true;
	} catch {
		toast.error('Não foi possível copiar a imagem.');
		return false;
	}
}
