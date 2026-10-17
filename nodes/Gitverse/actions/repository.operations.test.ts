import * as repository from './repository.operations';
import { createApi, createContext, locator, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('repository operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getRepository', () => {
		it('should GET the repository', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: { id: 1 } });

			const result = await repository.getRepository.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(BASE);
			expect(result).toEqual({ id: 1 });
		});
	});

	describe('getManyRepositories', () => {
		it('should list the repositories of the token owner', async () => {
			const ctx = createContext({ params: { returnAll: false, limit: 2 } });
			api.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });

			const result = await repository.getManyRepositories.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/repos', {
				params: { page: 1, per_page: 2 },
			});
			expect(result).toHaveLength(2);
		});

		it('should list the repositories of an organization', async () => {
			const ctx = createContext({
				params: { organization: 'acme', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await repository.getManyRepositories.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/acme/repos', {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('createRepository', () => {
		it('should POST to /user/repos', async () => {
			const ctx = createContext({
				params: {
					name: 'new-repo',
					description: 'description',
					private: true,
					autoInit: true,
				},
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			await repository.createRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/user/repos', {
				name: 'new-repo',
				description: 'description',
				private: true,
				auto_init: true,
			});
		});

		it('should POST to the organization endpoint when set', async () => {
			const ctx = createContext({
				params: { name: 'new-repo', organization: 'acme' },
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			await repository.createRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(
				'/orgs/acme/repos',
				expect.objectContaining({ name: 'new-repo' })
			);
		});

		it('should require a name', async () => {
			const ctx = createContext();

			await expect(repository.createRepository.call(ctx, api as any, 0)).rejects.toThrow(
				'Repository name is required'
			);
		});
	});

	describe('updateRepository', () => {
		it('should PATCH only the provided fields', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					updateFields: {
						description: 'new',
						private: true,
						defaultBranch: 'develop',
						hasIssues: false,
						hasWiki: false,
						hasPullRequests: false,
						archived: true,
						website: 'https://example.com',
					},
				},
			});
			api.patch.mockResolvedValue({ data: { id: 1 } });

			await repository.updateRepository.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(BASE, {
				description: 'new',
				private: true,
				default_branch: 'develop',
				has_issues: false,
				has_wiki: false,
				has_pull_requests: false,
				archived: true,
				website: 'https://example.com',
			});
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: { id: 1 } });

			await repository.updateRepository.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(BASE, {});
		});
	});

	describe('deleteRepository', () => {
		it('should DELETE the repository', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.delete.mockResolvedValue({ data: '' });

			const result = await repository.deleteRepository.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(BASE);
			expect(result).toBe('');
		});

		it('should fall back to a success marker when the payload is missing', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.delete.mockResolvedValue({ data: null });

			expect(await repository.deleteRepository.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});
	});

	describe('getCollaborators', () => {
		it('should GET the collaborators', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 5 },
			});
			api.get.mockResolvedValue({ data: [{ login: 'alice' }] });

			const result = await repository.getCollaborators.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/collaborators`, {
				params: { page: 1, per_page: 5 },
			});
			expect(result).toEqual([{ login: 'alice' }]);
		});
	});

	describe('addCollaborator', () => {
		it('should PUT the permission', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					username: 'alice',
					permission: 'admin',
				},
			});
			api.put.mockResolvedValue({ data: { ok: true } });

			await repository.addCollaborator.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/collaborators/alice`, {
				permission: 'admin',
			});
		});

		it('should default the permission to write', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, username: 'alice' },
			});
			api.put.mockResolvedValue({ data: null });

			const result = await repository.addCollaborator.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/collaborators/alice`, {
				permission: 'write',
			});
			expect(result).toEqual({ success: true });
		});

		it('should require a username', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(repository.addCollaborator.call(ctx, api as any, 0)).rejects.toThrow(
				'Username is required'
			);
		});
	});

	describe('getLanguages', () => {
		it('should GET the language breakdown', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: { TypeScript: 100 } });

			expect(await repository.getLanguages.call(ctx, api as any, 0)).toEqual({
				TypeScript: 100,
			});
			expect(api.get).toHaveBeenCalledWith(`${BASE}/languages`);
		});
	});

	describe('forkRepository', () => {
		it('should POST an empty body without an organization', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.post.mockResolvedValue({ data: { id: 2 } });

			await repository.forkRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/forks`, {});
		});

		it('should POST the target organization', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, organization: 'acme' },
			});
			api.post.mockResolvedValue({ data: { id: 2 } });

			await repository.forkRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/forks`, {
				organization: 'acme',
			});
		});
	});

	it('should read the repository from a locator value', async () => {
		const ctx = createContext({
			params: { repository: locator('other-owner/other-repo', 'url') },
		});
		api.get.mockResolvedValue({ data: {} });

		await repository.getRepository.call(ctx, api as any, 0);

		expect(api.get).toHaveBeenCalledWith('/repos/other-owner/other-repo');
	});
});
