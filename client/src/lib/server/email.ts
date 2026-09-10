import { Agent, fetch as undiciFetch } from 'undici';
import { env } from '$env/dynamic/private';

/**
 * Thin client for the internal Email Microservice (see /openapi.json).
 * The service is a stateless SMTP relay — every request carries the SMTP
 * connection details, so SMTP_* env vars are ours, not the service's.
 *
 * The service runs on a private LAN IP with a self-signed certificate, so
 * TLS verification is disabled for this one client only (via undici's own
 * fetch + a dedicated Agent) — never set NODE_TLS_REJECT_UNAUTHORIZED=0
 * globally, that would stop verifying certs for every other outgoing
 * HTTPS request the server makes.
 */
const internalServiceAgent = new Agent({ connect: { rejectUnauthorized: false } });

interface SendEmailInput {
	to: string[];
	subject: string;
	html: string;
	text?: string;
}

interface SendEmailResponse {
	messageId: string;
	accepted: string[];
	rejected: string[];
	response: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
	const baseUrl = requireEnv('EMAIL_SERVICE_URL');

	const res = await undiciFetch(`${baseUrl}/email/send`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		dispatcher: internalServiceAgent,
		body: JSON.stringify({
			smtp: {
				host: requireEnv('EMAIL_SMTP_HOST'),
				port: Number(env.EMAIL_SMTP_PORT ?? 587),
				secure: env.EMAIL_SMTP_SECURE === 'true',
				auth: env.EMAIL_SMTP_USER
					? { user: env.EMAIL_SMTP_USER, pass: requireEnv('EMAIL_SMTP_PASS') }
					: undefined
			},
			from: requireEnv('EMAIL_FROM'),
			to,
			subject,
			html,
			text
		})
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`sendEmail failed (${res.status}): ${body}`);
	}

	return (await res.json()) as SendEmailResponse;
}

function requireEnv(name: string) {
	const value = env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}
