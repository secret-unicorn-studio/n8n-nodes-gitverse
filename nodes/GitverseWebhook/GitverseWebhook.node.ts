import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { hookEventOptions } from '../Gitverse/descriptions/hook.description';

/** Headers a Gitverse (Gitea-derived) delivery may carry the event name in. */
export const EVENT_HEADERS = [
	'x-gitea-event',
	'x-gitverse-event',
	'x-gitea-hook',
	'x-forgejo-event',
	'x-github-event',
];

/** Headers carrying the delivery ID, useful when debugging a hook. */
export const DELIVERY_HEADERS = [
	'x-gitea-delivery',
	'x-gitverse-delivery',
	'x-github-delivery',
];

export const gitverseWebhookProperties: any[] = [
	{
		displayName: 'Repository',
		name: 'repository',
		type: 'string',
		default: '',
		placeholder: 'owner/repo',
		description:
			'Only run the workflow for events of this repository, in the format "owner/repo". Leave empty to accept every repository.',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		default: ['*'],
		options: [{ name: 'All Events', value: '*' }, ...hookEventOptions],
		description: 'Events to listen for. The wildcard is handled by the node itself.',
	},
];

function readHeader(
	headers: Record<string, any>,
	names: string[]
): string | undefined {
	for (const name of names) {
		const value = headers[name];

		if (typeof value === 'string' && value !== '') {
			return value;
		}
	}

	return undefined;
}

/**
 * Gitverse delivers the event name in a header, but the exact header is not part
 * of the public documentation, so the payload is used as a fallback.
 */
export function detectEvent(headers: Record<string, any>, body: Record<string, any>): string {
	const fromHeader = readHeader(headers, EVENT_HEADERS);

	if (fromHeader) {
		return fromHeader;
	}

	return detectEventFromPayload(body);
}

/**
 * Best-effort event detection for deliveries without a usable header.
 */
export function detectEventFromPayload(body: Record<string, any>): string {
	if (body.review) {
		return 'pull_request_review';
	}

	if (body.comment) {
		return 'pull_request_comment';
	}

	if (body.pull_request) {
		return 'pull_request';
	}

	if (Array.isArray(body.commits)) {
		return 'push';
	}

	if (body.forkee) {
		return 'fork';
	}

	if (body.ref_type) {
		return 'create';
	}

	return '';
}

/**
 * The header can only tell a `pull_request` apart so far: reviews and comments
 * are delivered under the same event name and are refined from the payload.
 */
function refineEvent(event: string, body: Record<string, any>): string {
	if (event !== 'pull_request') {
		return event;
	}

	if (body.review || body.action === 'reviewed') {
		return 'pull_request_review';
	}

	if (body.comment) {
		return 'pull_request_comment';
	}

	return 'pull_request';
}

function repositoryFullName(body: Record<string, any>): string {
	const repository = (body.repository as Record<string, any>) || {};

	return String(repository.full_name || repository.name || '');
}

export class GitverseWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gitverse Webhook',
		name: 'gitverseWebhook',
		icon: 'file:gitverse.svg',
		group: ['trigger'],
		version: 1,
		description: 'Receive events from Gitverse via webhooks',
		defaults: {
			name: 'Gitverse Webhook',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'gitverseApi',
				required: true,
			},
		],
		properties: gitverseWebhookProperties,
		webhooks: [
			{
				name: 'default',
				path: 'webhook',
				httpMethod: 'POST',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData() as Record<string, any>;
		const headers = this.getHeaderData();
		const event = refineEvent(detectEvent(headers, body), body);

		const selected = this.getNodeParameter('events', ['*']) as string[];
		const accepted = selected.includes('*') || selected.length === 0;

		if (!accepted && event !== '' && !selected.includes(event)) {
			return { webhookResponse: 200 };
		}

		const repoFullName = repositoryFullName(body);
		const repoFilter = String(this.getNodeParameter('repository', '')).trim();

		if (repoFilter && repoFullName && !matchesRepository(repoFullName, repoFilter)) {
			return { webhookResponse: 200 };
		}

		return {
			webhookResponse: 200,
			workflowData: [
				[
					{
						json: {
							event,
							delivery: readHeader(headers, DELIVERY_HEADERS) ?? '',
							repository: repoFullName,
							payload: body,
							timestamp: new Date().toISOString(),
						},
					},
				],
			],
		};
	}
}

/**
 * Match a payload repository against the configured filter, which can be a full
 * `owner/repo` or just the repository name. The comparison is case-insensitive.
 */
function matchesRepository(fullName: string, filter: string): boolean {
	const value = fullName.toLowerCase();
	const expected = filter.toLowerCase().replace(/\.git$/, '');

	return value === expected || value.endsWith(`/${expected}`);
}
