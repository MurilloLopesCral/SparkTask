/** Shared zod-friendly helpers for Plexus linkage + version phase dates. */

export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export type ProjectPlexusForm = {
	plexusProjectId: string;
	plexusTopicCode: string;
};

export type VersionPhaseForm = {
	implementationStart: string;
	implementationEnd: string;
	assistedOpsStart: string;
	assistedOpsEnd: string;
	performanceStart: string;
	performanceEnd: string;
};

/** Create-project form still seeds V1 dates + plexus in one payload. */
export type ProjectLifecycleForm = ProjectPlexusForm & VersionPhaseForm;

export function emptyPlexusForm(): ProjectPlexusForm {
	return { plexusProjectId: '', plexusTopicCode: '' };
}

export function emptyPhaseForm(): VersionPhaseForm {
	return {
		implementationStart: '',
		implementationEnd: '',
		assistedOpsStart: '',
		assistedOpsEnd: '',
		performanceStart: '',
		performanceEnd: ''
	};
}

export function emptyLifecycleForm(): ProjectLifecycleForm {
	return { ...emptyPlexusForm(), ...emptyPhaseForm() };
}

export function plexusFromProject(project: {
	plexusProjectId?: string | null;
	plexusTopicCode?: string | null;
}): ProjectPlexusForm {
	return {
		plexusProjectId: project.plexusProjectId ?? '',
		plexusTopicCode: project.plexusTopicCode ?? ''
	};
}

export function phasesFromVersion(version: {
	implementationStart?: string | null;
	implementationEnd?: string | null;
	assistedOpsStart?: string | null;
	assistedOpsEnd?: string | null;
	performanceStart?: string | null;
	performanceEnd?: string | null;
}): VersionPhaseForm {
	return {
		implementationStart: version.implementationStart ?? '',
		implementationEnd: version.implementationEnd ?? '',
		assistedOpsStart: version.assistedOpsStart ?? '',
		assistedOpsEnd: version.assistedOpsEnd ?? '',
		performanceStart: version.performanceStart ?? '',
		performanceEnd: version.performanceEnd ?? ''
	};
}

const emptyToNull = (value: string) => (value.trim() ? value.trim() : null);

export function plexusPayload(form: ProjectPlexusForm) {
	return {
		plexusProjectId: emptyToNull(form.plexusProjectId),
		plexusTopicCode: emptyToNull(form.plexusTopicCode)
	};
}

export function phasePayload(form: VersionPhaseForm) {
	return {
		implementationStart: emptyToNull(form.implementationStart),
		implementationEnd: emptyToNull(form.implementationEnd),
		assistedOpsStart: emptyToNull(form.assistedOpsStart),
		assistedOpsEnd: emptyToNull(form.assistedOpsEnd),
		performanceStart: emptyToNull(form.performanceStart),
		performanceEnd: emptyToNull(form.performanceEnd)
	};
}

export function lifecyclePayload(form: ProjectLifecycleForm) {
	return { ...plexusPayload(form), ...phasePayload(form) };
}
