import * as commit from './commit.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('commit operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getCommit', () => {
		it('should GET a commit by SHA', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, sha: 'abc123' },
			});
			api.get.mockResolvedValue({ data: { sha: 'abc123' } });

			const result = await commit.getCommit.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/commits/abc123`);
			expect(result).toEqual({ sha: 'abc123' });
		});

		it('should require a SHA', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(commit.getCommit.call(ctx, api as any, 0)).rejects.toThrow(
				'Commit SHA is required'
			);
		});
	});

	describe('getManyCommits', () => {
		it('should list commits with pagination', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 3 },
			});
			api.get.mockResolvedValue({ data: [{ sha: 'a' }] });

			const result = await commit.getManyCommits.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/commits`, {
				params: { page: 1, per_page: 3 },
			});
			expect(result).toEqual([{ sha: 'a' }]);
		});

		it('should pass the branch and path filters', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					returnAll: true,
					sha: 'develop',
					path: 'src/index.ts',
				},
			});
			api.get.mockResolvedValue({ data: [] });

			await commit.getManyCommits.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/commits`, {
				params: { sha: 'develop', path: 'src/index.ts', page: 1, per_page: 50 },
			});
		});
	});

	describe('compareCommits', () => {
		it('should GET the comparison', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, base: 'main', head: 'feature/x' },
			});
			api.get.mockResolvedValue({ data: { total_commits: 1 } });

			const result = await commit.compareCommits.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/compare/main...feature%2Fx`);
			expect(result).toEqual({ total_commits: 1 });
		});

		it('should require a base', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, head: 'feature' },
			});

			await expect(commit.compareCommits.call(ctx, api as any, 0)).rejects.toThrow(
				'Base reference is required'
			);
		});

		it('should require a head', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, base: 'main' },
			});

			await expect(commit.compareCommits.call(ctx, api as any, 0)).rejects.toThrow(
				'Head reference is required'
			);
		});
	});
});
