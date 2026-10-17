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

describe('repository git database and migration operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getTree', () => {
		it('should GET a tree with the recursive flag', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					treeSha: 'heads/main',
					recursive: true,
				},
			});
			api.get.mockResolvedValue({ data: { sha: 'abc' } });

			const result = await repository.getTree.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/git/trees/heads/main`, {
				params: { recursive: true },
			});
			expect(result).toEqual({ sha: 'abc' });
		});

		it('should send no parameters by default and encode the SHA', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, treeSha: 'a b/c' },
			});
			api.get.mockResolvedValue({ data: {} });

			await repository.getTree.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/git/trees/a%20b/c`, { params: {} });
		});

		it('should require the tree SHA', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(repository.getTree.call(ctx, api as any, 0)).rejects.toThrow(
				'Tree SHA is required'
			);
		});
	});

	describe('getRef', () => {
		it('should GET a single ref', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, refName: 'heads/main' },
			});
			api.get.mockResolvedValue({ data: { ref: 'refs/heads/main' } });

			const result = await repository.getRef.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/git/ref/heads/main`);
			expect(result).toEqual({ ref: 'refs/heads/main' });
		});

		it('should require the ref', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(repository.getRef.call(ctx, api as any, 0)).rejects.toThrow(
				'Ref is required'
			);
		});
	});

	describe('getMatchingRefs', () => {
		it('should GET the matching refs', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, refName: 'heads/release' },
			});
			api.get.mockResolvedValue({ data: [{ ref: 'refs/heads/release/1' }] });

			const result = await repository.getMatchingRefs.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/git/matching-refs/heads/release`);
			expect(result).toEqual([{ ref: 'refs/heads/release/1' }]);
		});
	});

	describe('createRef', () => {
		it('should POST the ref and the SHA', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					refName: 'refs/heads/new-feature',
					refSha: 'a1b2c3d',
				},
			});
			api.post.mockResolvedValue({ data: { ref: 'refs/heads/new-feature' } });

			const result = await repository.createRef.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/refs`, {
				ref: 'refs/heads/new-feature',
				sha: 'a1b2c3d',
			});
			expect(result).toEqual({ ref: 'refs/heads/new-feature' });
		});

		it('should require the SHA', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, refName: 'refs/heads/x' },
			});

			await expect(repository.createRef.call(ctx, api as any, 0)).rejects.toThrow(
				'SHA is required'
			);
		});
	});

	describe('deleteRef', () => {
		it('should DELETE the ref', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, refName: 'heads/old' },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await repository.deleteRef.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/git/refs/heads/old`);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, refName: 'heads/old' },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await repository.deleteRef.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});

	describe('createTree', () => {
		it('should POST the entries and the base tree', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					baseTree: 'f00dcafe',
					treeEntries: {
						values: [
							{ path: 'README.md', mode: '100644', type: 'blob', sha: 'a1b2' },
							{ path: 'src/', mode: '040000', type: 'tree', sha: 'f00d' },
						],
					},
				},
			});
			api.post.mockResolvedValue({ data: { sha: 'c0ffee' } });

			const result = await repository.createTree.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/trees`, {
				tree: [
					{ path: 'README.md', mode: '100644', type: 'blob', sha: 'a1b2' },
					{ path: 'src/', mode: '040000', type: 'tree', sha: 'f00d' },
				],
				base_tree: 'f00dcafe',
			});
			expect(result).toEqual({ sha: 'c0ffee' });
		});

		it('should send an empty tree when nothing is configured', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, treeEntries: null },
			});
			api.post.mockResolvedValue({ data: {} });

			await repository.createTree.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/trees`, { tree: [] });
		});
	});

	describe('createCommit', () => {
		it('should POST the commit with the author and the committer', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					commitMessage: 'feat: add config',
					treeSha: 'd3adb33f',
					parents: 'a1b2, c3d4',
					author: { name: 'Alice', email: 'alice@example.com', date: '2026-01-01T12:00:00Z' },
					committer: { name: 'Bob', email: 'bob@example.com' },
				},
			});
			api.post.mockResolvedValue({ data: { sha: 'e5f6' } });

			const result = await repository.createCommit.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/commits`, {
				message: 'feat: add config',
				tree: 'd3adb33f',
				parents: ['a1b2', 'c3d4'],
				author: { name: 'Alice', email: 'alice@example.com', date: '2026-01-01T12:00:00Z' },
				committer: { name: 'Bob', email: 'bob@example.com' },
			});
			expect(result).toEqual({ sha: 'e5f6' });
		});

		it('should send the message and the tree alone', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					commitMessage: 'chore: empty',
					treeSha: 'd3adb33f',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await repository.createCommit.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/git/commits`, {
				message: 'chore: empty',
				tree: 'd3adb33f',
			});
		});

		it('should require the message', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, treeSha: 'd3adb33f' },
			});

			await expect(repository.createCommit.call(ctx, api as any, 0)).rejects.toThrow(
				'Commit message is required'
			);
		});

		it('should require the tree', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commitMessage: 'x' },
			});

			await expect(repository.createCommit.call(ctx, api as any, 0)).rejects.toThrow(
				'Tree SHA is required'
			);
		});
	});

	describe('setCollaboratorPermission', () => {
		it('should PUT the permission of the collaborator', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					collaboratorUsername: 'alice',
					permission: 'admin',
				},
			});
			api.put.mockResolvedValue({ data: { ok: true } });

			expect(await repository.setCollaboratorPermission.call(ctx, api as any, 0)).toEqual({
				ok: true,
			});
			expect(api.put).toHaveBeenCalledWith(`${BASE}/collaborators/alice`, {
				permission: 'admin',
			});
		});

		it('should send an empty permission by default', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, collaboratorUsername: 'alice' },
			});
			api.put.mockResolvedValue({ data: null });

			expect(await repository.setCollaboratorPermission.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
			expect(api.put).toHaveBeenCalledWith(`${BASE}/collaborators/alice`, {
				permission: '',
			});
		});

		it('should require the username', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(
				repository.setCollaboratorPermission.call(ctx, api as any, 0)
			).rejects.toThrow('Username is required');
		});
	});

	describe('migrateRepository', () => {
		it('should POST every provided option', async () => {
			const ctx = createContext({
				params: {
					sourceUrl: 'https://github.com/owner/repo.git',
					migrationName: 'repo',
					migrationOwner: 'acme',
					sourceType: 'github',
					sourceUsername: 'alice',
					sourcePassword: 'secret',
					sourceToken: 'token',
					migrationDescription: 'Imported',
					lfsEndpoint: 'https://lfs.example.com',
					private: true,
					useLfs: true,
					pullRequests: true,
					releases: true,
				},
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			const result = await repository.migrateRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/repos/migrate', {
				source_url: 'https://github.com/owner/repo.git',
				name: 'repo',
				owner: 'acme',
				source_type: 'github',
				source_username: 'alice',
				source_password: 'secret',
				source_token: 'token',
				description: 'Imported',
				lfs_endpoint: 'https://lfs.example.com',
				private: true,
				use_lfs: true,
				pull_requests: true,
				releases: true,
			});
			expect(result).toEqual({ id: 1 });
		});

		it('should send the source URL alone', async () => {
			const ctx = createContext({
				params: { sourceUrl: 'https://example.com/repo.git' },
			});
			api.post.mockResolvedValue({ data: {} });

			await repository.migrateRepository.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/repos/migrate', {
				source_url: 'https://example.com/repo.git',
			});
		});

		it('should require the source URL', async () => {
			const ctx = createContext({ params: {} });

			await expect(repository.migrateRepository.call(ctx, api as any, 0)).rejects.toThrow(
				'Source URL is required'
			);
		});
	});

	describe('getMigrationStatus', () => {
		it('should GET the migration status of a repository', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: { status: 'finished' } });

			const result = await repository.getMigrationStatus.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/migration/status`);
			expect(result).toEqual({ status: 'finished' });
		});
	});
});
