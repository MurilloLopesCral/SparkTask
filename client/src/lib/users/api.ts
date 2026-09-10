import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export interface InviteUserValues {
	email: string;
	role: string;
}

export interface InviteResult {
	ok: boolean;
	signupUrl?: string;
	emailSent?: boolean;
	message?: string;
}

// No toast here on purpose — the sheet already shows a richer inline result
// (a copyable link when the email fails to send), which a transient toast
// can't replace.
export async function inviteUser(groupId: string, values: InviteUserValues): Promise<InviteResult> {
	const res = await fetch(`/api/groups/${groupId}/invites`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(values)
	});
	const data = await res.json();
	await invalidateAll();

	if (!res.ok) {
		return { ok: false, message: data.message ?? 'Não foi possível criar o convite.' };
	}
	return { ok: true, signupUrl: data.signupUrl, emailSent: data.emailSent };
}

export async function revokeInvite(groupId: string, inviteId: string) {
	const res = await fetch(`/api/groups/${groupId}/invites/${inviteId}`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		toast.error('Não foi possível cancelar o convite.');
		return;
	}
	toast.success('Convite cancelado.');
}

export interface RemoveMemberResult {
	ok: boolean;
	message?: string;
}

export async function removeMember(groupId: string, memberId: string): Promise<RemoveMemberResult> {
	const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
	await invalidateAll();

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		const message = data.message ?? 'Não foi possível remover o membro.';
		toast.error(message);
		return { ok: false, message };
	}
	toast.success('Membro removido do grupo.');
	return { ok: true };
}
