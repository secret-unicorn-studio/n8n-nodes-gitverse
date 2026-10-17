import { NodeConnectionTypes } from 'n8n-workflow';
import {
	GitverseWebhook,
	detectEvent,
	detectEventFromPayload,
	gitverseWebhookProperties,
} from './GitverseWebhook.node';

interface WebhookOptions {
	body?: Record<string, any>;
	headers?: Record<string, any>;
	repository?: string;
	events?: string[];
}

function createWebhookContext({
	body = {},
	headers = {},
	repository = '',
	events = ['*'],
}: WebhookOptions = {}): any {
	const params: Record<string, any> = { repository, events };

	return {
		getBodyData: jest.fn(() => body),
		getHeaderData: jest.fn(() => headers),
		getNodeParameter: jest.fn((name: string, fallback?: any) =>
			name in params ? params[name] : fallback
		),
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

		it('should offer the documented events and a wildcard', () => {
			const eventsProp = gitverseWebhookProperties.find((p) => p.name === 'events');
			const values = (eventsProp.options as any[]).map((o) => o.value);

			expect(eventsProp.default).toEqual(['*']);
			expect(values).toEqual([
				'*',
				'create',
				'delete',
				'fork',
				'pull_request',
				'pull_request_comment',
				'pull_request_review',
				'push',
			]);
		});

		it('should keep the repository filter optional', () => {
			const repoProp = gitverseWebhookProperties.find((p) => p.name === 'repository');

			expect(repoProp.required).toBeUndefined();
			expect(repoProp.default).toBe('');
		});

		it('should implement a webhook method', () => {
			expect(typeof node.webhook).toBe('function');
		});
	});

	describe('detectEvent', () => {
		it('should read every supported event header', () => {
			expect(detectEvent({ 'x-gitea-event': 'push' }, {})).toBe('push');
			expect(detectEvent({ 'x-gitverse-event': 'fork' }, {})).toBe('fork');
			expect(detectEvent({ 'x-gitea-hook': 'delete' }, {})).toBe('delete');
			expect(detectEvent({ 'x-forgejo-event': 'create' }, {})).toBe('create');
			expect(detectEvent({ 'x-github-event': 'pull_request' }, {})).toBe('pull_request');
		});

		it('should ignore empty header values', () => {
			expect(detectEvent({ 'x-gitea-event': '' }, { commits: [] })).toBe('push');
		});

		it('should fall back to the payload', () => {
			expect(detectEventFromPayload({ pull_request: {} })).toBe('pull_request');
			expect(detectEventFromPayload({ review: {} })).toBe('pull_request_review');
			expect(detectEventFromPayload({ comment: {} })).toBe('pull_request_comment');
			expect(detectEventFromPayload({ commits: [] })).toBe('push');
			expect(detectEventFromPayload({ forkee: {} })).toBe('fork');
			expect(detectEventFromPayload({ ref_type: 'branch' })).toBe('create');
			expect(detectEventFromPayload({})).toBe('');
		});
	});

	describe('webhook', () => {
		it('should return the event, the delivery and the payload', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-event': 'push', 'x-gitea-delivery': 'abc-123' },
			});

			const result = await node.webhook.call(ctx);
			const json = result.workflowData![0][0].json as any;

			expect(result.webhookResponse).toBe(200);
			expect(json.event).toBe('push');
			expect(json.delivery).toBe('abc-123');
			expect(json.repository).toBe('SUSTUDIO/n8n-nodes-gitverse');
			expect(json.payload).toEqual({
				repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' },
			});
			expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
		});

		it('should report an empty delivery when the header is missing', async () => {
			const ctx = createWebhookContext({
				body: { commits: [] },
				headers: { 'x-gitea-event': 'push' },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.delivery).toBe('');
		});

		it('should carry the event type from the header', async () => {
			const ctx = createWebhookContext({
				body: {},
				headers: { 'x-gitea-event': 'pull_request' },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('pull_request');
		});

		it('should refine a pull request comment delivery', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'pull_request' },
				body: { comment: { id: 1 }, pull_request: { number: 2 } },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('pull_request_comment');
		});

		it('should refine a reviewed pull request delivery', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'pull_request' },
				body: { review: { id: 1 } },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('pull_request_review');
		});

		it('should keep a foreign event name untouched', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'issues' },
				body: { issue: { number: 1 } },
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('issues');
		});

		it('should fall back to the payload when there is no header', async () => {
			const ctx = createWebhookContext({ body: { commits: [{ id: 'a' }] } });

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('push');
		});

		it('should keep an unknown event', async () => {
			const ctx = createWebhookContext({ body: {}, events: ['*'] });

			const result = await node.webhook.call(ctx);

			expect(result.workflowData![0][0].json.event).toBe('');
		});

		it('should run when the wildcard is selected', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'pull_request' },
				events: ['*'],
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should run when no event is selected at all', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'pull_request' },
				events: [],
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should skip an event the node does not listen for', async () => {
			const ctx = createWebhookContext({
				headers: { 'x-gitea-event': 'fork' },
				events: ['push'],
			});

			const result = await node.webhook.call(ctx);

			expect(result).toEqual({ webhookResponse: 200 });
			expect(result.workflowData).toBeUndefined();
		});

		it('should pass an unknown event through a filter', async () => {
			const ctx = createWebhookContext({ body: {}, events: ['push'] });

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should skip the workflow when the repository filter does not match', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'someone/other-repo' } },
				headers: { 'x-gitea-event': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result).toEqual({ webhookResponse: 200 });
			expect(result.workflowData).toBeUndefined();
		});

		it('should match the filter case-insensitively', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-event': 'push' },
				repository: 'sustudio/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should accept the bare repository name as a filter', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-event': 'push' },
				repository: 'n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should tolerate a filter with a .git suffix', async () => {
			const ctx = createWebhookContext({
				body: { repository: { full_name: 'SUSTUDIO/n8n-nodes-gitverse' } },
				headers: { 'x-gitea-event': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse.git',
			});

			expect((await node.webhook.call(ctx)).workflowData).toHaveLength(1);
		});

		it('should fall back to repository.name when full_name is absent', async () => {
			const ctx = createWebhookContext({
				body: { repository: { name: 'n8n-nodes-gitverse' } },
				headers: { 'x-gitea-event': 'push' },
				repository: 'n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
		});

		it('should pass through when the payload has no repository', async () => {
			const ctx = createWebhookContext({
				body: {},
				headers: { 'x-gitea-event': 'push' },
				repository: 'SUSTUDIO/n8n-nodes-gitverse',
			});

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toHaveLength(1);
			expect(result.workflowData![0][0].json.repository).toBe('');
		});
	});
});
