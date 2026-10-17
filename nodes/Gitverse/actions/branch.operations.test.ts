import * as branch from './branch.operations';
import { createApi, createContext, locator, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('branch operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getBranch', () => {
		it('should GET the branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, branch: locator('feature/x', 'list') },
			});
			api.get.mockResolvedValue({ data: { name: 'feature/x' } });

			const result = await branch.getBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/branches/feature/x`);
			expect(result).toEqual({ name: 'feature/x' });
		});

		it('should require a branch name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, branch: locator('') },
			});

			await expect(branch.getBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'Branch name is required'
			);
		});
	});

	describe('getManyBranches', () => {
		it('should list branches with pagination', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ name: 'main' }] });

			const result = await branch.getManyBranches.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/branches`, {
				params: { page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ name: 'main' }]);
		});
	});

	describe('createBranch', () => {
		it('should create a ref from the base branch SHA', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					newBranch: 'feature/new',
					baseBranch: 'main',
				},
			});
			api.get.mockResolvedValue({ data: { commit: { sha: 'abc123' } } });
			api.post.mockResolvedValue({ data: { ref: 'refs/heads/feature/new' } });

			const result = await branch.createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/branches/main`);
			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/refs`, {
				ref: 'refs/heads/feature/new',
				sha: 'abc123',
			});
			expect(result).toEqual({ ref: 'refs/heads/feature/new' });
		});

		it('should default the base branch to main', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, newBranch: 'feature/new' },
			});
			api.get.mockResolvedValue({ data: { commit: { sha: 'abc123' } } });
			api.post.mockResolvedValue({ data: {} });

			await branch.createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/branches/main`);
		});

		it('should fall back to main when the base branch is empty', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					newBranch: 'feature/new',
					baseBranch: '',
				},
			});
			api.get.mockResolvedValue({ data: { commit: { sha: 'abc123' } } });
			api.post.mockResolvedValue({ data: {} });

			await branch.createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/branches/main`);
		});

		it('should require the new branch name', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(branch.createBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'New branch name is required'
			);
		});
	});

	describe('deleteBranch', () => {
		it('should DELETE the ref', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, branch: locator('feature/x') },
			});
			api.delete.mockResolvedValue({ data: '' });

			await branch.deleteBranch.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/git/refs/heads/feature/x`);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, branch: locator('feature/x') },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await branch.deleteBranch.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require a branch name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, branch: locator('') },
			});

			await expect(branch.deleteBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'Branch name is required'
			);
		});
	});
});
