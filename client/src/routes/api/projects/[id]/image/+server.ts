import { error, json } from '@sveltejs/kit';
import {
	PROJECT_PHOTOS_FOLDER,
	uploadToCloudinary
} from '$lib/server/cloudinary';
import { setProjectImage, userCanAccessProject } from '$lib/server/projects';
import type { RequestHandler } from './$types';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** POST /api/projects/:id/image — upload project icon to Cloudinary. */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id))) {
		error(403, 'Sem acesso a este projeto.');
	}

	const form = await request.formData();
	const upload = form.get('file');
	if (!(upload instanceof File)) {
		return json({ message: 'Nenhuma imagem enviada.' }, { status: 400 });
	}

	const extension = upload.name.split('.').pop()?.toLowerCase() ?? '';
	if (!IMAGE_EXTENSIONS.includes(extension)) {
		return json(
			{ message: `Formato não permitido. Use: ${IMAGE_EXTENSIONS.join(', ')}.` },
			{ status: 400 }
		);
	}
	if (upload.size > IMAGE_MAX_BYTES) {
		return json({ message: 'Imagem muito grande. Máximo de 5 MB.' }, { status: 400 });
	}

	const buffer = Buffer.from(await upload.arrayBuffer());

	let uploaded;
	try {
		uploaded = await uploadToCloudinary(
			buffer,
			upload.name,
			'image',
			PROJECT_PHOTOS_FOLDER
		);
	} catch (err) {
		console.error('Cloudinary project image upload failed:', err);
		return json({ message: 'Falha ao enviar a imagem.' }, { status: 502 });
	}

	await setProjectImage(params.id, uploaded.secure_url);
	return json({ image: uploaded.secure_url });
};

/** DELETE /api/projects/:id/image — clear the project icon. */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessProject(locals.user.id, params.id))) {
		error(403, 'Sem acesso a este projeto.');
	}

	await setProjectImage(params.id, null);
	return json({ success: true });
};
