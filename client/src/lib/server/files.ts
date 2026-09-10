import { eq } from 'drizzle-orm';
import { db } from './db';
import { file, type fileResourceTypeEnum } from './db/schema';
import { userCanAccessTask } from './tasks';

export interface CreateFileInput {
	name: string;
	size: number;
	assetUrl: string;
	cloudinaryPublicId: string;
	resourceType: (typeof fileResourceTypeEnum.enumValues)[number];
	taskId: string;
	uploadedBy: string;
}

export async function createFileRecord(input: CreateFileInput) {
	const [created] = await db.insert(file).values(input).returning();
	return created;
}

export async function getFileById(fileId: string) {
	return db.query.file.findFirst({ where: eq(file.id, fileId) });
}

export async function deleteFileRecord(fileId: string) {
	await db.delete(file).where(eq(file.id, fileId));
}

/** A file is reachable exactly when its parent task is. */
export async function userCanAccessFile(userId: string, fileId: string) {
	const row = await getFileById(fileId);
	if (!row) return false;
	return userCanAccessTask(userId, row.taskId);
}
