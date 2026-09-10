import { error, json } from '@sveltejs/kit';
import {
	getAllowedExtensions,
	getMaxFileSizeBytes,
	resourceTypeForExtension,
	uploadToCloudinary
} from '$lib/server/cloudinary';
import { createFileRecord } from '$lib/server/files';
import { userCanAccessTask } from '$lib/server/tasks';
import type { RequestHandler } from './$types';

/** POST /api/tasks/:id/files — upload one attachment (multipart/form-data, field "file"). */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessTask(locals.user.id, params.id)))
		error(403, 'Sem acesso a esta tarefa.');

	const form = await request.formData();
	const upload = form.get('file');
	if (!(upload instanceof File)) {
		return json({ message: 'Nenhum arquivo enviado.' }, { status: 400 });
	}

	const extension = upload.name.split('.').pop()?.toLowerCase() ?? '';
	const allowedExtensions = getAllowedExtensions();
	if (!allowedExtensions.includes(extension)) {
		return json(
			{ message: `Formato não permitido. Use: ${allowedExtensions.join(', ')}.` },
			{ status: 400 }
		);
	}

	const maxBytes = getMaxFileSizeBytes();
	if (upload.size > maxBytes) {
		return json(
			{ message: `Arquivo muito grande. Máximo de ${Math.floor(maxBytes / 1024 / 1024)}MB.` },
			{ status: 400 }
		);
	}

	const buffer = Buffer.from(await upload.arrayBuffer());
	const resourceType = resourceTypeForExtension(extension);

	let uploaded;
	try {
		uploaded = await uploadToCloudinary(buffer, upload.name, resourceType);
	} catch (err) {
		console.error('Cloudinary upload failed:', err);
		return json({ message: 'Falha ao enviar o arquivo.' }, { status: 502 });
	}

	const created = await createFileRecord({
		name: upload.name,
		size: upload.size,
		assetUrl: uploaded.secure_url,
		cloudinaryPublicId: uploaded.public_id,
		resourceType,
		taskId: params.id,
		uploadedBy: locals.user.id
	});

	return json({ file: created }, { status: 201 });
};
