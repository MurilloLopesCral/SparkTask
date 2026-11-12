/** Spark catalog tints mapped to task priority — no purple-default AI look. */
export const PRIORITY_CHIP: Record<string, { bar: string; chip: string; label: string }> = {
	low: {
		bar: 'bg-tint-steel',
		chip: 'border-tint-steel/60 bg-tint-steel/25 text-ink',
		label: 'Baixa'
	},
	medium: {
		bar: 'bg-tint-sky',
		chip: 'border-tint-sky/60 bg-tint-sky/30 text-ink',
		label: 'Média'
	},
	high: {
		bar: 'bg-tint-peach',
		chip: 'border-tint-peach/60 bg-tint-peach/30 text-ink',
		label: 'Alta'
	},
	critical: {
		bar: 'bg-dell-red',
		chip: 'border-dell-red bg-dell-red/15 text-ink',
		label: 'Crítica'
	}
};

export function priorityChip(priority: string) {
	return PRIORITY_CHIP[priority] ?? PRIORITY_CHIP.medium;
}
