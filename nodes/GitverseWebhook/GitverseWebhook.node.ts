import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionTypes,
} from 'n8n-workflow';

export const gitverseWebhookProperties: any[] = [
	{
		displayName: 'Repository',
		name: 'repository',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'owner/repo',
		description: 'Repository to listen for push events (format "owner/repo")',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		default: ['push'],
		options: [
			{
				name: 'Push',
				value: 'push',
			},
			{
				name: 'Pull Request',
				value: 'pull_request',
			},
			{
				name: 'Issues',
				value: 'issues',
			},
		],
		description: 'Events to listen for',
	},
];

export class GitverseWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gitverse Webhook',
		name: 'gitverseWebhook',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
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
		const body = this.getBodyData();
		const headers = this.getHeaderData();

		// Extract event type from header
		const eventType = (headers['x-gitea-hook'] as string) || 'push';

		// Extract repository from body
		const repository = (body as any).repository || {};
		const repoFullName = repository.full_name || repository.name || '';

		// Check if this event is configured for this webhook
		const repoParam = this.getNodeParameter('repository', 0) as string;
		if (repoParam && repoFullName && !repoFullName.includes(repoParam)) {
			return {
				webhookResponse: 200,
			};
		}

		const workflowData: IWebhookResponseData = {
			webhookResponse: 200,
			workflowData: [
				[
					{
						json: {
							event: eventType,
							payload: body,
							timestamp: new Date().toISOString(),
						},
					},
				],
			],
		};

		return workflowData;
	}
}
