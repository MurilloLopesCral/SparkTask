import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { mcpAccessKey } from '../db/schema';
import { userCanAccessGroup } from '../projects';
import { DEFAULT_MCP_SCOPES, normalizeScopes, type McpScope } from './scopes';

const KEY_PREFIX = 'spk_';

export type McpKeyPublic = {
	id: string;
	name: string;
	keyPrefix: string;
	groupId: string;
	groupName: string;
	scopes: string[];
	lastUsedAt: Date | null;
	createdAt: Date;
};

export type McpAuthContext = {
	keyId: string;
	userId: string;
	userName: string | null;
	userEmail: string;
	groupId: string;
	scopes: string[];
};

function hashKey(secret: string) {
	return createHash('sha256').update(secret).digest('hex');
}

function generateSecret() {
	return `${KEY_PREFIX}${randomBytes(24).toString('base64url')}`;
}

function safeEqualHex(a: string, b: string) {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

export async function listMcpKeysForUser(userId: string): Promise<McpKeyPublic[]> {
	const rows = await db.query.mcpAccessKey.findMany({
		where: and(eq(mcpAccessKey.userId, userId), isNull(mcpAccessKey.revokedAt)),
		with: { group: { columns: { id: true, name: true } } },
		orderBy: [desc(mcpAccessKey.createdAt)]
	});

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		keyPrefix: row.keyPrefix,
		groupId: row.groupId,
		groupName: row.group.name,
		scopes: row.scopes ?? [],
		lastUsedAt: row.lastUsedAt,
		createdAt: row.createdAt
	}));
}

export async function createMcpKey(input: {
	userId: string;
	groupId: string;
	name: string;
	scopes?: McpScope[];
}) {
	const member = await userCanAccessGroup(input.userId, input.groupId);
	if (!member) {
		return { ok: false as const, message: 'Você não pertence a este grupo.', status: 403 };
	}

	const scopes = normalizeScopes(input.scopes?.length ? input.scopes : DEFAULT_MCP_SCOPES);
	if (scopes.length === 0) {
		return { ok: false as const, message: 'Selecione ao menos um escopo.', status: 400 };
	}

	const secret = generateSecret();
	const keyPrefix = secret.slice(0, 12);
	const keyHash = hashKey(secret);

	const [created] = await db
		.insert(mcpAccessKey)
		.values({
			userId: input.userId,
			groupId: input.groupId,
			name: input.name.trim().slice(0, 80),
			keyPrefix,
			keyHash,
			scopes
		})
		.returning({
			id: mcpAccessKey.id,
			name: mcpAccessKey.name,
			keyPrefix: mcpAccessKey.keyPrefix,
			groupId: mcpAccessKey.groupId,
			scopes: mcpAccessKey.scopes,
			createdAt: mcpAccessKey.createdAt
		});

	return { ok: true as const, key: created, secret };
}

export async function revokeMcpKey(userId: string, keyId: string) {
	const [updated] = await db
		.update(mcpAccessKey)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(mcpAccessKey.id, keyId),
				eq(mcpAccessKey.userId, userId),
				isNull(mcpAccessKey.revokedAt)
			)
		)
		.returning({ id: mcpAccessKey.id });

	if (!updated) {
		return { ok: false as const, message: 'Chave não encontrada.', status: 404 };
	}
	return { ok: true as const };
}

/**
 * Authenticates an MCP request.
 * Required: `x-api-key` (Claude Desktop / mcp-remote).
 * Optional override: `x-spark-group-id` (must match the key's group for MVP).
 */
export async function authenticateMcpRequest(request: Request): Promise<
	| { ok: true; ctx: McpAuthContext }
	| { ok: false; status: number; message: string }
> {
	const apiKey = request.headers.get('x-api-key')?.trim();
	if (!apiKey) {
		return { ok: false, status: 401, message: 'Cabeçalho x-api-key ausente.' };
	}
	if (!apiKey.startsWith(KEY_PREFIX)) {
		return { ok: false, status: 401, message: 'Formato de chave inválido.' };
	}

	const digest = hashKey(apiKey);
	const row = await db.query.mcpAccessKey.findFirst({
		where: and(eq(mcpAccessKey.keyHash, digest), isNull(mcpAccessKey.revokedAt)),
		with: {
			user: { columns: { id: true, name: true, email: true, isActive: true } }
		}
	});

	// Constant-time-ish miss: still compare against a dummy if needed later.
	if (!row || !safeEqualHex(row.keyHash, digest)) {
		return { ok: false, status: 401, message: 'Chave inválida ou revogada.' };
	}
	if (!row.user.isActive) {
		return { ok: false, status: 403, message: 'Usuário inativo.' };
	}

	const overrideGroup = request.headers.get('x-spark-group-id')?.trim();
	const groupId = overrideGroup || row.groupId;
	if (groupId !== row.groupId) {
		return {
			ok: false,
			status: 403,
			message: 'Esta chave não tem acesso ao grupo informado em x-spark-group-id.'
		};
	}

	const stillMember = await userCanAccessGroup(row.userId, groupId);
	if (!stillMember) {
		return { ok: false, status: 403, message: 'Você não é mais membro deste grupo.' };
	}

	// Fire-and-forget last-used stamp — do not block the tool call.
	void db
		.update(mcpAccessKey)
		.set({ lastUsedAt: new Date() })
		.where(eq(mcpAccessKey.id, row.id))
		.catch(() => undefined);

	return {
		ok: true,
		ctx: {
			keyId: row.id,
			userId: row.user.id,
			userName: row.user.name,
			userEmail: row.user.email,
			groupId,
			scopes: row.scopes ?? []
		}
	};
}
