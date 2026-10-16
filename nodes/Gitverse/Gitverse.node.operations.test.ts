import {
	getRepository,
	getManyRepositories,
	getBranch,
	getManyBranches,
	createBranch,
	getFile,
	createOrUpdateFile,
	getPullRequest,
	getManyPullRequests,
	createPullRequest,
	compareBranches,
	getManyCommits,
} from './Gitverse.node.operations';

interface ContextOptions {
	params?: Record<string, any>;
}

function createContext({ params = {} }: ContextOptions = {}): any {
	return {
		getNodeParameter: jest.fn(
			(name: string, _itemIndex: number, fallback?: any) => {
				if (name in params) {
					return params[name];
				}
				return fallback;
			}
		),
		getNode: jest.fn(() => ({ name: 'Gitverse', type: 'gitverse' })),
	};
}

function createApi(data: any = {}) {
	return {
		get: jest.fn().mockResolvedValue({ data }),
		post: jest.fn().mockResolvedValue({ data }),
		put: jest.fn().mockResolvedValue({ data }),
	};
}

const baseParams = { owner: 'SUSTUDIO', repo: 'n8n-nodes-gitverse' };

describe('Gitverse.node.operations', () => {
	describe('getRepository', () => {
		it('should GET repository by owner/repo', async () => {
			const api = createApi({ id: 1, name: 'n8n-nodes-gitverse' });
			const ctx = createContext({ params: baseParams });

			const result = await getRepository.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse');
			expect(result).toEqual({ id: 1, name: 'n8n-nodes-gitverse' });
		});

		it('should throw when owner is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: { repo: 'n8n-nodes-gitverse' } });

			await expect(getRepository.call(ctx, api as any, 2)).rejects.toThrow(
				/Both owner and repo are required/
			);
			expect(api.get).not.toHaveBeenCalled();
		});

		it('should throw when repo is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: { owner: 'SUSTUDIO' } });

			await expect(getRepository.call(ctx, api as any, 0)).rejects.toThrow(
				'Both owner and repo are required. Got: owner=SUSTUDIO, repo=undefined'
			);
		});
	});

	describe('getManyRepositories', () => {
		it('should GET user repos with default filters', async () => {
			const api = createApi([{ id: 1 }]);
			const ctx = createContext();

			const result = await getManyRepositories.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/api/v1/user/repos', {
				params: { type: 'all', sort: 'asc', page: 1, perPage: 50 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should pass custom filters', async () => {
			const api = createApi([]);
			const ctx = createContext({
				params: { filters: { type: 'source', sort: 'desc', perPage: 10 } },
			});

			await getManyRepositories.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/api/v1/user/repos', {
				params: { type: 'source', sort: 'desc', page: 1, perPage: 10 },
			});
		});

		it('should not require owner/repo', async () => {
			const api = createApi([]);
			const ctx = createContext();

			await expect(
				getManyRepositories.call(ctx, api as any, 0)
			).resolves.toEqual([]);
		});
	});

	describe('getBranch', () => {
		it('should GET branch by name', async () => {
			const api = createApi({ name: 'main' });
			const ctx = createContext({ params: { ...baseParams, branch: 'develop' } });

			const result = await getBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/branches/develop'
			);
			expect(result).toEqual({ name: 'main' });
		});

		it('should throw when branch is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: baseParams });

			await expect(getBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'Branch name is required'
			);
		});

		it('should throw when branch is an empty string', async () => {
			const api = createApi();
			const ctx = createContext({ params: { ...baseParams, branch: '' } });

			await expect(getBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'Branch name is required'
			);
		});
	});

	describe('getManyBranches', () => {
		it('should GET branches with pagination defaults', async () => {
			const api = createApi([{ name: 'main' }]);
			const ctx = createContext({ params: baseParams });

			const result = await getManyBranches.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/branches',
				{ params: { page: 1, perPage: 50 } }
			);
			expect(result).toEqual([{ name: 'main' }]);
		});

		it('should throw when owner/repo are missing', async () => {
			const api = createApi();
			const ctx = createContext();

			await expect(getManyBranches.call(ctx, api as any, 0)).rejects.toThrow(
				/Both owner and repo are required/
			);
		});
	});

	describe('createBranch', () => {
		it('should read base branch SHA and create a ref', async () => {
			const api = createApi();
			(api.get as jest.Mock).mockResolvedValue({
				data: { commit: { sha: 'abc123' } },
			});
			(api.post as jest.Mock).mockResolvedValue({ data: { ref: 'refs/heads/feature' } });
			const ctx = createContext({
				params: { ...baseParams, newBranch: 'feature', baseBranch: 'develop' },
			});

			const result = await createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/branches/develop'
			);
			expect(api.post).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/git/refs',
				{ ref: 'refs/heads/feature', sha: 'abc123' }
			);
			expect(result).toEqual({ ref: 'refs/heads/feature' });
		});

		it('should default base branch to main', async () => {
			const api = createApi();
			(api.get as jest.Mock).mockResolvedValue({ data: { commit: { sha: 'sha-main' } } });
			const ctx = createContext({ params: { ...baseParams, newBranch: 'feature' } });

			await createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/branches/main'
			);
		});

		it('should fall back to main when base branch is empty', async () => {
			const api = createApi();
			(api.get as jest.Mock).mockResolvedValue({ data: { commit: { sha: 'sha-main' } } });
			const ctx = createContext({
				params: { ...baseParams, newBranch: 'feature', baseBranch: '' },
			});

			await createBranch.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/branches/main'
			);
		});

		it('should throw when new branch name is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: baseParams });

			await expect(createBranch.call(ctx, api as any, 0)).rejects.toThrow(
				'New branch name is required'
			);
			expect(api.get).not.toHaveBeenCalled();
			expect(api.post).not.toHaveBeenCalled();
		});
	});

	describe('getFile', () => {
		it('should GET file contents', async () => {
			const api = createApi({ content: 'aGVsbG8=' });
			const ctx = createContext({ params: { ...baseParams, filePath: 'README.md' } });

			const result = await getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/contents/README.md'
			);
			expect(result).toEqual({ content: 'aGVsbG8=' });
		});

		it('should preserve nested paths', async () => {
			const api = createApi({});
			const ctx = createContext({
				params: { ...baseParams, filePath: 'docs/guide/intro.md' },
			});

			await getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/contents/docs/guide/intro.md'
			);
		});

		it('should throw when file path is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: baseParams });

			await expect(getFile.call(ctx, api as any, 0)).rejects.toThrow(
				'File path is required'
			);
		});
	});

	describe('createOrUpdateFile', () => {
		it('should PUT base64-encoded content with defaults', async () => {
			const api = createApi({ commit: { sha: 'new' } });
			const ctx = createContext({
				params: { ...baseParams, filePath: 'notes.txt', content: 'hello world' },
			});

			const result = await createOrUpdateFile.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/contents/notes.txt',
				{
					message: 'Update file via n8n',
					content: Buffer.from('hello world').toString('base64'),
					branch: 'main',
				}
			);
			expect(result).toEqual({ commit: { sha: 'new' } });
		});

		it('should use provided message, branch and sha', async () => {
			const api = createApi({});
			const ctx = createContext({
				params: {
					...baseParams,
					filePath: 'notes.txt',
					content: 'body',
					commitMessage: 'docs: update notes',
					branch: 'develop',
					sha: 'deadbeef',
				},
			});

			await createOrUpdateFile.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/contents/notes.txt',
				{
					message: 'docs: update notes',
					content: Buffer.from('body').toString('base64'),
					branch: 'develop',
					sha: 'deadbeef',
				}
			);
		});

		it('should omit sha when not provided', async () => {
			const api = createApi({});
			const ctx = createContext({
				params: { ...baseParams, filePath: 'notes.txt', content: 'body', sha: '' },
			});

			await createOrUpdateFile.call(ctx, api as any, 0);

			const body = (api.put as jest.Mock).mock.calls[0][1];
			expect(body).not.toHaveProperty('sha');
		});

		it('should throw when content is missing', async () => {
			const api = createApi();
			const ctx = createContext({
				params: { ...baseParams, filePath: 'notes.txt' },
			});

			await expect(createOrUpdateFile.call(ctx, api as any, 0)).rejects.toThrow(
				'File path and content are required'
			);
			expect(api.put).not.toHaveBeenCalled();
		});

		it('should throw when file path is missing', async () => {
			const api = createApi();
			const ctx = createContext({ params: { ...baseParams, content: 'body' } });

			await expect(createOrUpdateFile.call(ctx, api as any, 0)).rejects.toThrow(
				'File path and content are required'
			);
		});
	});

	describe('getPullRequest', () => {
		it('should GET pull request by index', async () => {
			const api = createApi({ number: 7 });
			const ctx = createContext({ params: { ...baseParams, prIndex: 7 } });

			const result = await getPullRequest.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/pulls/7'
			);
			expect(result).toEqual({ number: 7 });
		});

		it('should accept index 0', async () => {
			const api = createApi({});
			const ctx = createContext({ params: { ...baseParams, prIndex: 0 } });

			await getPullRequest.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/pulls/0'
			);
		});

		it('should throw when index is undefined', async () => {
			const api = createApi();
			const ctx = createContext({ params: baseParams });

			await expect(getPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Pull request index is required'
			);
		});

		it('should throw when index is null', async () => {
			const api = createApi();
			const ctx = createContext({ params: { ...baseParams, prIndex: null } });

			await expect(getPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Pull request index is required'
			);
		});
	});

	describe('getManyPullRequests', () => {
		it('should GET pull requests with pagination defaults', async () => {
			const api = createApi([{ number: 1 }]);
			const ctx = createContext({ params: baseParams });

			const result = await getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/pulls',
				{ params: { page: 1, perPage: 50 } }
			);
			expect(result).toEqual([{ number: 1 }]);
		});
	});

	describe('createPullRequest', () => {
		it('should POST pull request with defaults', async () => {
			const api = createApi({ number: 3 });
			const ctx = createContext({
				params: {
					...baseParams,
					head: 'feature',
					title: 'Add feature',
					body: 'Description',
				},
			});

			const result = await createPullRequest.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/pulls',
				{
					title: 'Add feature',
					body: 'Description',
					head: 'feature',
					base: 'main',
					maintainerCanModify: true,
				}
			);
			expect(result).toEqual({ number: 3 });
		});

		it('should respect maintainerCanModify = false', async () => {
			const api = createApi({});
			const ctx = createContext({
				params: {
					...baseParams,
					head: 'feature',
					title: 'Add feature',
					maintainerCanModify: false,
				},
			});

			await createPullRequest.call(ctx, api as any, 0);

			expect((api.post as jest.Mock).mock.calls[0][1].maintainerCanModify).toBe(false);
		});

		it('should throw when head is missing', async () => {
			const api = createApi();
			const ctx = createContext({
				params: { ...baseParams, title: 'Add feature' },
			});

			await expect(createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Head, base, and title are required'
			);
			expect(api.post).not.toHaveBeenCalled();
		});

		it('should throw when title is missing', async () => {
			const api = createApi();
			const ctx = createContext({
				params: { ...baseParams, head: 'feature' },
			});

			await expect(createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Head, base, and title are required'
			);
		});
	});

	describe('compareBranches', () => {
		it('should GET branch comparison', async () => {
			const api = createApi({ commits: [] });
			const ctx = createContext({
				params: { ...baseParams, baseBranch: 'main', headBranch: 'feature' },
			});

			const result = await compareBranches.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/compare/main...feature'
			);
			expect(result).toEqual({ commits: [] });
		});

		it('should throw when head branch is missing', async () => {
			const api = createApi();
			const ctx = createContext({
				params: { ...baseParams, baseBranch: 'main' },
			});

			await expect(compareBranches.call(ctx, api as any, 0)).rejects.toThrow(
				'Base and head branches are required'
			);
		});

		it('should throw when base branch is missing', async () => {
			const api = createApi();
			const ctx = createContext({
				params: { ...baseParams, headBranch: 'feature' },
			});

			await expect(compareBranches.call(ctx, api as any, 0)).rejects.toThrow(
				'Base and head branches are required'
			);
		});
	});

	describe('getManyCommits', () => {
		it('should GET commits with pagination defaults', async () => {
			const api = createApi([{ sha: 'abc' }]);
			const ctx = createContext({ params: baseParams });

			const result = await getManyCommits.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(
				'/api/v1/repos/SUSTUDIO/n8n-nodes-gitverse/commits',
				{ params: { page: 1, perPage: 50 } }
			);
			expect(result).toEqual([{ sha: 'abc' }]);
		});

		it('should throw when owner/repo are missing', async () => {
			const api = createApi();
			const ctx = createContext();

			await expect(getManyCommits.call(ctx, api as any, 0)).rejects.toThrow(
				/Both owner and repo are required/
			);
		});
	});
});
