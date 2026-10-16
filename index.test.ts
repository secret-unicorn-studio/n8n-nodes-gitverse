import { Gitverse } from './nodes/Gitverse/Gitverse.node';
import { GitverseWebhook } from './nodes/GitverseWebhook/GitverseWebhook.node';
import { GitverseApi } from './credentials/GitverseApi.credentials';

describe('exports', () => {
	it('should export Gitverse node', () => {
		expect(Gitverse).toBeDefined();
		expect(typeof Gitverse).toBe('function');
		const node = new Gitverse();
		expect(node.description.name).toBe('gitverse');
	});

	it('should export GitverseWebhook node', () => {
		expect(GitverseWebhook).toBeDefined();
		expect(typeof GitverseWebhook).toBe('function');
		const node = new GitverseWebhook();
		expect(node.description.name).toBe('gitverseWebhook');
	});

	it('should export GitverseApi credentials', () => {
		expect(GitverseApi).toBeDefined();
		expect(typeof GitverseApi).toBe('function');
		const creds = new GitverseApi();
		expect(creds.name).toBe('gitverseApi');
	});
});
