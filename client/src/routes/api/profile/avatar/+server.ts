import { error, json } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { uploadToCloudinary } from '$lib/server/cloudinary';
import type { RequestHandler } from './$types';

const AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** POST /api/profile/avatar — uploads and sets the caller's profile picture. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');

	const form = await request.formData();
	const upload = form.get('file');
	if (!(upload instanceof File)) {
		return json({ message: 'Nenhuma imagem enviada.' }, { status: 400 });
	}

	const extension = upload.name.split('.').pop()?.toLowerCase() ?? '';
	if (!AVATAR_EXTENSIONS.includes(extension)) {
		return json(
			{ message: `Formato não permitido. Use: ${AVATAR_EXTENSIONS.join(', ')}.` },
			{ status: 400 }
		);
	}
	if (upload.size > AVATAR_MAX_BYTES) {
		return json({ message: 'Imagem muito grande. Máximo de 5MB.' }, { status: 400 });
	}

	const buffer = Buffer.from(await upload.arrayBuffer());

	let uploaded;
	try {
		uploaded = await uploadToCloudinary(buffer, upload.name, 'image');
	} catch (err) {
		console.error('Cloudinary avatar upload failed:', err);
		return json({ message: 'Falha ao enviar a imagem.' }, { status: 502 });
	}

	await auth.api.updateUser({
		body: { image: uploaded.secure_url },
		headers: request.headers
	});

	return json({ image: uploaded.secure_url });
};
