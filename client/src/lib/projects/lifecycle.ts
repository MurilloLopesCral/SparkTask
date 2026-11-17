/** Shared zod-friendly date helpers for project lifecycle + Plexus linkage. */

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type ProjectLifecycleForm = {
	plexusProjectId: string;
	plexusTopicCode: string;
	implementationStart: string;
	implementationEnd: string;
	assistedOpsStart: string;
	assistedOpsEnd: string;
	performanceStart: string;
	performanceEnd: string;
};

export function emptyLifecycleForm(): ProjectLifecycleForm {
	return {
		plexusProjectId: '',
		plexusTopicCode: '',
		implementationStart: '',
		implementationEnd: '',
		assistedOpsStart: '',
		assistedOpsEnd: '',
		performanceStart: '',
		performanceEnd: ''
	};
}

export function lifecycleFromProject(project: {
	plexusProjectId?: string | null;
	plexusTopicCode?: string | null;
	implementationStart?: string | null;
	implementationEnd?: string | null;
	assistedOpsStart?: string | null;
	assistedOpsEnd?: string | null;
	performanceStart?: string | null;
	performanceEnd?: string | null;
}): ProjectLifecycleForm {
	return {
		plexusProjectId: project.plexusProjectId ?? '',
		plexusTopicCode: project.plexusTopicCode ?? '',
		implementationStart: project.implementationStart ?? '',
		implementationEnd: project.implementationEnd ?? '',
		assistedOpsStart: project.assistedOpsStart ?? '',
		assistedOpsEnd: project.assistedOpsEnd ?? '',
		performanceStart: project.performanceStart ?? '',
		performanceEnd: project.performanceEnd ?? ''
	};
}

/** Empty string → null for API payloads. */
export function lifecyclePayload(form: ProjectLifecycleForm) {
	const emptyToNull = (value: string) => (value.trim() ? value.trim() : null);
	return {
		plexusProjectId: emptyToNull(form.plexusProjectId),
		plexusTopicCode: emptyToNull(form.plexusTopicCode),
		implementationStart: emptyToNull(form.implementationStart),
		implementationEnd: emptyToNull(form.implementationEnd),
		assistedOpsStart: emptyToNull(form.assistedOpsStart),
		assistedOpsEnd: emptyToNull(form.assistedOpsEnd),
		performanceStart: emptyToNull(form.performanceStart),
		performanceEnd: emptyToNull(form.performanceEnd)
	};
}
