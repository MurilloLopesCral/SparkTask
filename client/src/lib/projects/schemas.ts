import { z } from 'zod';
import { DATE_ONLY } from './lifecycle';

/** Accepts YYYY-MM-DD, empty string, or null → stores as `string | null`. */
const optionalDate = z
	.union([z.string().regex(DATE_ONLY), z.literal(''), z.null()])
	.optional()
	.transform((value) => (value === undefined || value === '' ? null : value));

const optionalPlexusId = z
	.union([z.string().max(64), z.literal(''), z.null()])
	.optional()
	.transform((value) => {
		if (value === undefined || value === null) return null;
		const trimmed = value.trim();
		return trimmed.length === 0 ? null : trimmed;
	});

export const projectLifecycleSchema = z.object({
	plexusProjectId: optionalPlexusId,
	implementationStart: optionalDate,
	implementationEnd: optionalDate,
	assistedOpsStart: optionalDate,
	assistedOpsEnd: optionalDate,
	performanceStart: optionalDate,
	performanceEnd: optionalDate
});
