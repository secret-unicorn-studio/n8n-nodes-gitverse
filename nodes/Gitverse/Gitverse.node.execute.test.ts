import { execute } from './Gitverse.node.execute';
import { Gitverse } from './Gitverse.node';
import { createApiClient } from '../../utils/api';

jest.mock('../../utils/api', () => ({
	createApiClient: jest.fn(),
}));

const mockCreateApiClient = createApiClient as jest.Mock;

type MockApi = { get: jest.Mock; post: jest.Mock; put: jest.Mock };

interface ContextOptions {
	params?: Record<string, any>;
	items?: any[];
	continueOnFail?: boolean;
}

function createContext({
	params = {},
	items = [{ json: {} }],
	continueOnFail = false,
}: ContextOptions = {}): any {
	return {
		getInputData: jest.fn(() => items),
		getNodeParameter: jest.fn(
			(name: string, itemIndex: number, fallback?: any) => {
				if (!(name in params)) {
					return fallback;
				}
				const value = params[name];
				return typeof value === 'function' ? value(itemIndex) : value;
			}
		),
		getCredentials: jest
			.fn()
			.mockResolvedValue({ baseUrl: 'https://gitverse.ru', token: 'secret-token' }),
		getNode: jest.fn(() => ({ name: 'Gitverse', type: 'gitverse' })),
		continueOnFail: jest.fn(() => continueOnFail),
	};
}

const repoParams = { owner: 'SUSTUDIO', repo: 'n8n-nodes-gitverse' };

describe('Gitverse.node.execute', () => {
	let api: MockApi;

	beforeEach(() => {
		jest.clearAllMocks();
		api = { get: jest.fn(), post: jest.fn(), put: jest.fn() };
		mockCreateApiClient.mockReturnValue(api);
	});

	it('should create the API client from credentials', async () => {
		api.get.mockResolvedValue({ data: {} });
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', ...repoParams },
		});

		await execute.call(ctx);

		expect(mockCreateApiClient).toHaveBeenCalledWith({
			baseUrl: 'https://gitverse.ru',
			token: 'secret-token',
		});
		expect(ctx.getCredentials).toHaveBeenCalledWith('gitverseApi');
	});

	it('should dispatch repository.get', async () => {
		api.get.mockResolvedValue({ data: { id: 1 } });
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', ...repoParams },
		});

		const result = await execute.call(ctx);

		expect(api.get).toHaveBeenCalledWith('/repos/SUSTUDIO/n8n-nodes-gitverse');
		expect(result).toEqual([{ json: { id: 1 } }]);
	});

	it('should dispatch repository.getAll', async () => {
		api.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
		const ctx = createContext({
			params: { resource: 'repository', operation: 'getAll' },
		});

		const result = await execute.call(ctx);

		expect(api.get).toHaveBeenCalledWith('/user/repos', expect.anything());
		expect(result).toEqual([{ json: [{ id: 1 }, { id: 2 }] }]);
	});

	it('should dispatch branch.create', async () => {
		api.get.mockResolvedValue({ data: { commit: { sha: 'base-sha' } } });
		api.post.mockResolvedValue({ data: { ref: 'refs/heads/feature' } });
		const ctx = createContext({
			params: {
				resource: 'branch',
				operation: 'create',
				...repoParams,
				newBranch: 'feature',
				baseBranch: 'main',
			},
		});

		const result = await execute.call(ctx);

		expect(api.post).toHaveBeenCalledWith(
			'/repos/SUSTUDIO/n8n-nodes-gitverse/git/refs',
			{ ref: 'refs/heads/feature', sha: 'base-sha' }
		);
		expect(result).toEqual([{ json: { ref: 'refs/heads/feature' } }]);
	});

	it('should dispatch file.createOrUpdate', async () => {
		api.put.mockResolvedValue({ data: { content: { sha: 'new-sha' } } });
		const ctx = createContext({
			params: {
				resource: 'file',
				operation: 'createOrUpdate',
				...repoParams,
				filePath: 'README.md',
				content: 'hello',
			},
		});

		await execute.call(ctx);

		expect(api.put).toHaveBeenCalledWith(
			'/repos/SUSTUDIO/n8n-nodes-gitverse/contents/README.md',
			expect.objectContaining({
				content: Buffer.from('hello').toString('base64'),
			})
		);
	});

	it('should dispatch pullRequest.compare', async () => {
		api.get.mockResolvedValue({ data: { commits: [] } });
		const ctx = createContext({
			params: {
				resource: 'pullRequest',
				operation: 'compare',
				...repoParams,
				baseBranch: 'main',
				headBranch: 'feature',
			},
		});

		await execute.call(ctx);

		expect(api.get).toHaveBeenCalledWith(
			'/repos/SUSTUDIO/n8n-nodes-gitverse/compare/main...feature'
		);
	});

	it('should dispatch through the node class execute method', async () => {
		api.get.mockResolvedValue({ data: { id: 42 } });
		const node = new Gitverse();
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', ...repoParams },
		});

		const result = await node.execute.call(ctx);

		expect(result).toEqual([[{ json: { id: 42 } }]]);
	});

	it('should dispatch commit.getAll', async () => {
		api.get.mockResolvedValue({ data: [{ sha: 'abc' }] });
		const ctx = createContext({
			params: { resource: 'commit', operation: 'getAll', ...repoParams },
		});

		await execute.call(ctx);

		expect(api.get).toHaveBeenCalledWith(
			'/repos/SUSTUDIO/n8n-nodes-gitverse/commits',
			expect.anything()
		);
	});

	it('should return an empty array for empty input', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', ...repoParams },
			items: [],
		});

		const result = await execute.call(ctx);

		expect(result).toEqual([]);
	});

	it('should process every input item with its own index', async () => {
		api.get.mockResolvedValueOnce({ data: { id: 1 } });
		api.get.mockResolvedValueOnce({ data: { id: 2 } });
		const ctx = createContext({
			params: {
				resource: 'repository',
				operation: 'get',
				owner: 'SUSTUDIO',
				repo: (index: number) => `repo-${index}`,
			},
			items: [{ json: {} }, { json: {} }],
		});

		const result = await execute.call(ctx);

		expect(api.get).toHaveBeenNthCalledWith(1, '/repos/SUSTUDIO/repo-0');
		expect(api.get).toHaveBeenNthCalledWith(2, '/repos/SUSTUDIO/repo-1');
		expect(result).toEqual([{ json: { id: 1 } }, { json: { id: 2 } }]);
	});

	it('should throw for an unknown resource', async () => {
		const ctx = createContext({
			params: { resource: 'unknown', operation: 'get' },
		});

		await expect(execute.call(ctx)).rejects.toThrow('Unknown resource: unknown');
		expect(api.get).not.toHaveBeenCalled();
	});

	it('should throw for an unknown operation', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'unknown', ...repoParams },
		});

		await expect(execute.call(ctx)).rejects.toThrow(
			'Unknown operation: unknown for resource repository'
		);
	});

	it('should return the error object when continueOnFail is enabled', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', repo: 'only-repo' },
			continueOnFail: true,
		});

		const result = await execute.call(ctx);

		expect(result).toHaveLength(1);
		expect(result[0].json.error).toContain('Both owner and repo are required');
		expect(result[0].pairedItem).toEqual({ item: 0 });
	});

	it('should keep processing items after a failure when continueOnFail is enabled', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'unknown', ...repoParams },
			items: [{ json: {} }, { json: {} }],
			continueOnFail: true,
		});

		const result = await execute.call(ctx);

		expect(result).toHaveLength(2);
		expect(result[0].pairedItem).toEqual({ item: 0 });
		expect(result[1].pairedItem).toEqual({ item: 1 });
	});
});
