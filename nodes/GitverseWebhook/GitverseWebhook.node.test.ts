import { NodeConnectionTypes } from 'n8n-workflow';
import {
	GitverseWebhook,
	gitverseWebhookProperties,
} from './GitverseWebhook.node';

interface WebhookOptions {
	body?: Record<string, any>;
	headers?: Record<string, any>;
	repository?: string;
}

function createWebhookContext({
	body = {},
	headers = {},
	repository = '',
}: WebhookOptions = {}): any {
	return {
		getBodyData: jest.fn(() => body),
		getHeaderData: jest.fn(() => headers),
		getNodeParameter: jest.fn(() => repository),
	};
}

describe('GitverseWebhook node', () => {
	const node = new GitverseWebhook();
	const desc = node.description;

	describe('description', () => {
		it('should have correct displayName', () => {
			expect(desc.displayName).toBe('Gitverse Webhook');
		});

		it('should have correct name', () => {
			expect(desc.name).toBe('gitverseWebhook');
		});

		it('should be a trigger with no inputs', () => {
			expect(desc.group).toEqual(['trigger']);
			expect(desc.inputs).toEqual([]);
		});

		it('should have a Main output', () => {
			expect(desc.outputs).toEqual([NodeConnectionTypes.Main]);
		});

		it('should have version 1', () => {
			expect(desc.version).toBe(1);
		});

		it('should require gitverseApi credentials', () => {
			expect(desc.credentials).toBeDefined();
			expect(desc.credentials![0].name).toBe('gitverseApi');
			expect(desc.credentials![0].required).toBe(true);
		});

		it('should expose a POST webhook', () => {
			expect(desc.webhooks).toEqual([
				{ name: 'default', path: 'webhook', httpMethod: 'POST' },
			]);
		});

		it('should use the webhook properties', () => {
			expect(desc.properties).toBe(gitverseWebhookProperties);
		});

		it('should define repository and events properties', () => {
			const repoProp = gitverseWebhookProperties.find(
				(p) => p.name === 'repository'
			);
			expect(repoProp).toBeDefined();
			expect(repoProp.required).toBe(true);

			const eventsProp = gitverseWebhookProperties.find((p) => p.name === 'events');
			expect(eventsProp).toBeDefined();
			expect(eventsProp.default).toEqual(['push']);
			const values = (eventsProp.options as any[]).map((o) => o.value);
			expect(values).toEqual(['push', 'pull_request', 'issues']);
		});

		it('should implement a webhook method', () => {
			expect(typeof node.webhook).toBe('function');
		});
	});

	describe('webhook', () => {
		it('should return event, payload and timestamp', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-hook': 'push' },
			});

			const result = await node.webhook.call(ctx);

			expect(result.webhookResponse).toBe(200);
			expect(result.workflowData).toHaveLength(1);
			const json = result.workflowData![0][0].json as any;
			expect(json.event).toBe('push');
			expect(json.payload).toEqual({
				repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' },
			});
			expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
		});

		it('should forward the event type from the header', async () => {
			const ctx = createWebhookContext({
				body: {},
				headers: { 'x-gitea-hook': 'pull_request' },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('pull_request');
		});

		it('should default the event type to push', async () => {
			const ctx = createWebhookContext({ body: {}, headers: {} });

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('push');
		});

		it('should skip the workflow when the repository filter does not match', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'someone/other-repo' } },
				headers: { 'x-gitea-hook': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result).toEqual({ webhookResponse: 200 });
			expect(result.workflowData).toBeUndefined();
		});

		it('should pass through when the repository filter matches', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-hook': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should fall back to repository.name when full_name is absent', async () => {
			const ctx = createWebhookContext({
				body: { repository: { name: 'n8n-nodes-gitverse' } },
				headers: { 'x-gitea-hook': 'push' },
				repository: 'n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should pass through when the payload has no repository', async () => {
			const ctx = createWebhookContext({
				body: {},
				headers: { 'x-gitea-hook': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});
	});
});
