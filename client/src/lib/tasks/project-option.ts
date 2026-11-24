/** Project picker shape for task create/edit — includes versions. */
export type TaskProjectOption = {
	id: string;
	name: string;
	groupId: string;
	versions: { id: string; label: string; sortOrder: number }[];
};
