import { listSearch } from './loadOptions';
import { createApiClient, fetchPages } from '../../../utils/api';

jest.mock('../../../utils/api', () => ({
	createApiClient: jest.fn(() => ({ mocked: true })),
	fetchPages: jest.fn(),
}));

const mockCreateApiClient = createApiClient as jest.Mock;
const mockFetchPages = fetchPages as jest.Mock;

interface LoadContextOptions {
	params?: Record<string, any>;
	credentials?: Record<string, any>;
}

function createLoadContext({ params = {}, credentials }: LoadContextOptions = {}): any {
	return {
		getNodeParameter: jest.fn((name: string) => params[name]),
		getCredentials: jest.fn().mockResolvedValue(
			credentials ?? {
				baseUrl: 'https://api.gitverse.ru',
				token: 'secret-token',
				retries: 2,
			}
		),
		getNode: jest.fn(() => ({ name: 'Gitverse', type: 'gitverse' })),
	};
}

describe('methods/loadOptions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('searchRepositories', () => {
		it('should build the client from the credentials', async () => {
			const ctx = createLoadContext();
			mockFetchPages.mockResolvedValue([]);

			await listSearch.searchRepositories.call(ctx);

			expect(mockCreateApiClient).toHaveBeenCalledWith(ctx, {
				baseUrl: 'https://api.gitverse.ru',
				token: 'secret-token',
				retries: 2,
			});
		});

		it('should map repositories to list entries', async () => {
			const ctx = createLoadContext();
			mockFetchPages.mockResolvedValue([
				{ full_name: 'SUSTUDIO/first' },
				{ full_name: 'SUSTUDIO/second' },
			]);

			const result = await listSearch.searchRepositories.call(ctx);

			expect(mockFetchPages).toHaveBeenCalledWith(expect.anything(), '/user/repos', {
				perPage: 100,
			});
			expect(result).toEqual({
				results: [
					{ name: 'SUSTUDIO/first', value: 'SUSTUDIO/first' },
					{ name: 'SUSTUDIO/second', value: 'SUSTUDIO/second' },
				],
			});
		});

		it('should filter on the search term', async () => {
			const ctx = createLoadContext();
			mockFetchPages.mockResolvedValue([
				{ full_name: 'SUSTUDIO/first' },
				{ full_name: 'other/second' },
			]);

			const result = await listSearch.searchRepositories.call(ctx, 'FIRST');

			expect(result.results).toEqual([
				{ name: 'SUSTUDIO/first', value: 'SUSTUDIO/first' },
			]);
		});

		it('should fall back to the repository name', async () => {
			const ctx = createLoadContext();
			mockFetchPages.mockResolvedValue([{ name: 'plain' }]);

			const result = await listSearch.searchRepositories.call(ctx);

			expect(result.results).toEqual([{ name: 'plain', value: 'plain' }]);
		});

		it('should skip entries without a name', async () => {
			const ctx = createLoadContext();
			mockFetchPages.mockResolvedValue([{}, { full_name: '' }, { full_name: 'kept/repo' }]);

			const result = await listSearch.searchRepositories.call(ctx);

			expect(result.results).toEqual([{ name: 'kept/repo', value: 'kept/repo' }]);
		});
	});

	describe('searchBranches', () => {
		it('should list the branches of the selected repository', async () => {
			const ctx = createLoadContext({
				params: { repository: { __rl: true, value: 'SUSTUDIO/n8n', mode: 'name' } },
			});
			mockFetchPages.mockResolvedValue([{ name: 'main' }, { name: 'develop' }]);

			const result = await listSearch.searchBranches.call(ctx);

			expect(mockFetchPages).toHaveBeenCalledWith(
				expect.anything(),
				'/repos/SUSTUDIO/n8n/branches',
				{ perPage: 100 }
			);
			expect(result).toEqual({
				results: [
					{ name: 'main', value: 'main' },
					{ name: 'develop', value: 'develop' },
				],
			});
		});

		it('should filter branches', async () => {
			const ctx = createLoadContext({
				params: { repository: 'SUSTUDIO/n8n' },
			});
			mockFetchPages.mockResolvedValue([{ name: 'main' }, { name: 'feature/x' }]);

			const result = await listSearch.searchBranches.call(ctx, 'feature');

			expect(result.results).toEqual([{ name: 'feature/x', value: 'feature/x' }]);
		});

		it('should skip branches without a name', async () => {
			const ctx = createLoadContext({ params: { repository: 'SUSTUDIO/n8n' } });
			mockFetchPages.mockResolvedValue([{}, { name: 'main' }]);

			const result = await listSearch.searchBranches.call(ctx);

			expect(result.results).toEqual([{ name: 'main', value: 'main' }]);
		});

		it('should return no results when no repository is selected', async () => {
			const ctx = createLoadContext();

			const result = await listSearch.searchBranches.call(ctx);

			expect(result).toEqual({ results: [] });
			expect(mockFetchPages).not.toHaveBeenCalled();
		});
	});
});
