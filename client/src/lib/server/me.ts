import { eq } from 'drizzle-orm';
import { db } from './db';
import { groupMember } from './db/schema';

export async function getUserGroups(userId: string) {
	const memberships = await db.query.groupMember.findMany({
		where: eq(groupMember.memberId, userId),
		with: { group: true }
	});

	return memberships.map((m) => ({
		id: m.group.id,
		name: m.group.name,
		role: m.role
	}));
}
