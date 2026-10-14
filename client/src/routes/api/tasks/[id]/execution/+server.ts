import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { finishExecution, pauseExecution, startExecution } from '$lib/server/executions';
import { userCanAccessTask } from '$lib/server/tasks';
import type { RequestHandler } from './$types';

const actionSchema = z.object({
	action: z.enum(['start', 'pause', 'finish'])
});

/** POST /api/tasks/:id/execution — start, pause, or finish timed work on a task. */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401, 'Não autenticado.');
	if (!(await userCanAccessTask(locals.user.id, params.id)))
		error(403, 'Sem acesso a esta tarefa.');

	const parsed = actionSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json({ message: 'Ação inválida.' }, { status: 400 });
	}

	const userId = locals.user.id;
	const taskId = params.id;

	const result =
		parsed.data.action === 'start'
			? await startExecution(taskId, userId)
			: parsed.data.action === 'pause'
				? await pauseExecution(taskId, userId)
				: await finishExecution(taskId, userId);

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ success: true, execution: result.execution });
};
