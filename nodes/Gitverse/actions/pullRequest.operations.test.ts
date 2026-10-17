import * as pullRequest from './pullRequest.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('pull request operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getPullRequest', () => {
		it('should GET a pull request by number', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockResolvedValue({ data: { number: 7 } });

			const result = await pullRequest.getPullRequest.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7`);
			expect(result).toEqual({ number: 7 });
		});

		it('should require a number', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: undefined },
			});

			await expect(pullRequest.getPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Pull request number is required'
			);
		});
	});

	describe('getManyPullRequests', () => {
		it('should list pull requests filtered by state', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, state: 'all', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ number: 1 }] });

			const result = await pullRequest.getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls`, {
				params: { state: 'all', page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ number: 1 }]);
		});

		it('should default the state to open', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 2 },
			});
			api.get.mockResolvedValue({ data: [] });

			await pullRequest.getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls`, {
				params: { state: 'open', page: 1, per_page: 2 },
			});
		});
	});

	describe('createPullRequest', () => {
		it('should POST the pull request', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					title: 'Add feature',
					head: 'feature/x',
					base: 'main',
					body: 'Details',
				},
			});
			api.post.mockResolvedValue({ data: { number: 1 } });

			await pullRequest.createPullRequest.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls`, {
				title: 'Add feature',
				head: 'feature/x',
				base: 'main',
				body: 'Details',
			});
		});

		it('should default the body to an empty string', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					title: 'Add feature',
					head: 'feature/x',
					base: 'main',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await pullRequest.createPullRequest.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls`, {
				title: 'Add feature',
				head: 'feature/x',
				base: 'main',
				body: '',
			});
		});

		it('should require a title', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, head: 'feature/x', base: 'main' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Title is required'
			);
		});

		it('should require a head branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, title: 'T', base: 'main' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Head branch is required'
			);
		});

		it('should require a base branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, title: 'T', head: 'feature/x' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Base branch is required'
			);
		});
	});
});
