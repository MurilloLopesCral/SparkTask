import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export type CreateAdminGroupExisting = {
	mode: 'existing';
	name: string;
	ownerUserId: string;
};

export type CreateAdminGroupInvite = {
	mode: 'invite';
	name: string;
	ownerEmail: string;
};

export type CreateAdminGroupResult =
	| {
			mode: 'existing';
			group: { id: string; name: string; isActive: boolean };
			owner: { id: string; name: string | null; email: string };
	  }
	| {
			mode: 'invite';
			group: { id: string; name: string; isActive: boolean };
			invite: { id: string; email: string; expiresAt: string | Date };
			signupUrl: string;
			emailSent: boolean;
	  };

export async function createAdminGroup(
	input: CreateAdminGroupExisting | CreateAdminGroupInvite
): Promise<CreateAdminGroupResult | null> {
	const res = await fetch('/api/admin/groups', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(input)
	});
	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível criar o grupo.');
		return null;
	}

	await invalidateAll();

	if (data.mode === 'invite') {
		toast.success(
			data.emailSent
				? `Grupo criado. Convite enviado para ${data.invite.email}.`
				: `Grupo criado. Copie o link — o e-mail não foi enviado.`
		);
	} else {
		toast.success(`Grupo "${data.group.name}" criado.`);
	}

	return data as CreateAdminGroupResult;
}

export async function setAdminGroupActive(groupId: string, isActive: boolean) {
	const res = await fetch(`/api/admin/groups/${groupId}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ isActive })
	});
	const data = await res.json().catch(() => ({}));
	await invalidateAll();

	if (!res.ok) {
		toast.error(data.message ?? 'Não foi possível atualizar o grupo.');
		return false;
	}
	toast.success(isActive ? 'Grupo reativado.' : 'Grupo desativado.');
	return true;
}
