// Shared trigger for the "task completed" confetti burst. Any code path that
// marks a task done (kanban drag, dropdown, table context menu, edit dialog
// save) calls celebrate(taskId); whichever card/row is currently rendering
// that task id reacts locally and bursts confetti from itself.
//
// `current` self-clears a bit after the burst's animation duration — without
// this, switching between the kanban and table views (which unmounts and
// remounts every TaskConfettiBurst) would find the same still-set taskId and
// replay the burst on mount, indefinitely, for a task that was marked done
// long ago.
const BURST_LIFETIME_MS = 2500;

class CelebrationState {
	current = $state<{ taskId: string; burstId: number } | null>(null);
	#nextBurstId = 0;

	celebrate(taskId: string) {
		const burstId = this.#nextBurstId++;
		this.current = { taskId, burstId };
		setTimeout(() => {
			if (this.current?.burstId === burstId) this.current = null;
		}, BURST_LIFETIME_MS);
	}
}

export const celebration = new CelebrationState();
