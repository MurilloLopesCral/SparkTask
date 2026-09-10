import { error, json } from '@sveltejs/kit';
import { deleteFromCloudinary } from '$lib/server/cloudinary';
import { deleteFileRecord, getFileById, userCanAccessFile } from '$lib/server/files';
import type { RequestHandler } from './$types';

/** DELETE /api/files/:id — removes the Cloudinary asset, then its DB record. */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessFile(locals.user.id, params.id)))
		error(403, 'Sem acesso a este arquivo.');

	const fileRow = await getFileById(params.id);
	if (!fileRow) error(404, 'Arquivo não encontrado.');

	try {
		await deleteFromCloudinary(fileRow.cloudinaryPublicId, fileRow.resourceType);
	} catch (err) {
		console.error('Cloudinary delete failed:', err);
		return json({ message: 'Falha ao excluir o arquivo.' }, { status: 502 });
	}

	await deleteFileRecord(params.id);
	return json({ success: true });
};
