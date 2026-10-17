import { execute, operations } from './Gitverse.node.execute';
import { createApiClient } from '../../utils/api';
import { createApi, createContext, repositoryLocator } from './__testutils__/context';

jest.mock('../../utils/api', () => {
	const actual = jest.requireActual('../../utils/api');

	return { ...actual, createApiClient: jest.fn() };
});

const mockCreateApiClient = createApiClient as jest.Mock;

describe('Gitverse.node.execute', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
		mockCreateApiClient.mockReturnValue(api);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should build the client from the credentials', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', repository: repositoryLocator },
		});
		api.get.mockResolvedValue({ data: { id: 1 } });

		await execute.call(ctx);

		expect(mockCreateApiClient).toHaveBeenCalledWith({
			baseUrl: 'https://api.gitverse.ru',
			token: 'secret-token',
			retries: undefined,
		});
	});

	it('should return a single item for a single object', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', repository: repositoryLocator },
		});
		api.get.mockResolvedValue({ data: { id: 1, name: 'repo' } });

		const result = await execute.call(ctx);

		expect(result).toEqual([
			{ json: { id: 1, name: 'repo' }, pairedItem: { item: 0 } },
		]);
	});

	it('should flatten array results into one item each', async () => {
		const ctx = createContext({
			params: {
				resource: 'repository',
				operation: 'getAll',
				returnAll: false,
				limit: 5,
			},
		});
		api.get.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });

		const result = await execute.call(ctx);

		expect(result).toHaveLength(2);
		expect(result[0].json).toEqual({ id: 1 });
		expect(result[1].json).toEqual({ id: 2 });
	});

	it('should wrap empty payloads', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'delete', repository: repositoryLocator },
		});
		api.delete.mockResolvedValue({ data: undefined });

		const result = await execute.call(ctx);

		expect(result).toEqual([{ json: { success: true }, pairedItem: { item: 0 } }]);
	});

	it('should iterate over every input item', async () => {
		const ctx = createContext({
			items: [{ json: {} }, { json: {} }],
			params: { resource: 'repository', operation: 'get', repository: repositoryLocator },
		});
		api.get.mockResolvedValue({ data: { id: 1 } });

		const result = await execute.call(ctx);

		expect(api.get).toHaveBeenCalledTimes(2);
		expect(result).toHaveLength(2);
		expect(result[1].pairedItem).toEqual({ item: 1 });
	});

	it('should throw for an unknown resource', async () => {
		const ctx = createContext({
			params: { resource: 'nope', operation: 'get' },
		});

		await expect(execute.call(ctx)).rejects.toThrow('Unknown resource: nope');
	});

	it('should throw for an unknown operation', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'nope' },
		});

		await expect(execute.call(ctx)).rejects.toThrow(
			'Unknown operation: nope for resource repository'
		);
	});

	it('should record the error when continueOnFail is set', async () => {
		const ctx = createContext({
			continueOnFail: true,
			params: { resource: 'repository', operation: 'get', repository: repositoryLocator },
		});
		api.get.mockRejectedValue(new Error('boom'));

		const result = await execute.call(ctx);

		expect(result).toEqual([
			{ json: { error: 'boom' }, pairedItem: { item: 0 } },
		]);
	});

	it('should rethrow when continueOnFail is not set', async () => {
		const ctx = createContext({
			params: { resource: 'repository', operation: 'get', repository: repositoryLocator },
		});
		api.get.mockRejectedValue(new Error('boom'));

		await expect(execute.call(ctx)).rejects.toThrow('boom');
	});

	it('should expose an operation for every advertised resource', () => {
		expect(Object.keys(operations).sort()).toEqual([
			'branch',
			'commit',
			'file',
			'hook',
			'issue',
			'label',
			'organization',
			'pullRequest',
			'release',
			'repository',
			'user',
		]);
	});
});
