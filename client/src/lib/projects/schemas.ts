import { z } from 'zod';
import { DATE_ONLY } from './lifecycle';

/** Accepts YYYY-MM-DD, empty string, or null → stores as `string | null`. */
const optionalDate = z
	.union([z.string().regex(DATE_ONLY), z.literal(''), z.null()])
	.optional()
	.transform((value) => (value === undefined || value === '' ? null : value));

const optionalTrimmed = (max: number) =>
	z
		.union([z.string().max(max), z.literal(''), z.null()])
		.optional()
		.transform((value) => {
			if (value === undefined || value === null) return null;
			const trimmed = value.trim();
			return trimmed.length === 0 ? null : trimmed;
		});

export const projectPlexusSchema = z.object({
	plexusProjectId: optionalTrimmed(64),
	plexusTopicCode: optionalTrimmed(64)
});

export const versionPhaseSchema = z.object({
	implementationStart: optionalDate,
	implementationEnd: optionalDate,
	assistedOpsStart: optionalDate,
	assistedOpsEnd: optionalDate,
	performanceStart: optionalDate,
	performanceEnd: optionalDate
});

/** Create project: plexus + V1 phase dates in one shot. */
export const projectLifecycleSchema = projectPlexusSchema.merge(versionPhaseSchema);

export const versionUpdateSchema = versionPhaseSchema.extend({
	plexusSyncEnabled: z.boolean().optional(),
	label: z.string().min(1).max(32).optional(),
	description: z
		.union([z.string().max(4000), z.literal(''), z.null()])
		.optional()
		.transform((value) => {
			if (value === undefined) return undefined;
			if (value === null || value === '') return null;
			return value.trim() || null;
		})
});
