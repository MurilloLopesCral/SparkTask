import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export interface ProfileFormValues {
	name: string;
	email: string;
}

export async function updateProfile(values: ProfileFormValues) {
	const res = await fetch('/api/profile', {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(values)
	});
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível atualizar o perfil.');
		return false;
	}
	if (data.emailChangeRequested) {
		toast.success('Perfil atualizado. Confira seu novo e-mail para confirmar a troca.');
	} else {
		toast.success('Perfil atualizado.');
	}
	return true;
}

export async function uploadAvatar(file: File) {
	const form = new FormData();
	form.set('file', file);

	const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		toast.error(data.message ?? 'Não foi possível enviar a foto.');
		return false;
	}
	toast.success('Foto de perfil atualizada.');
	return true;
}
