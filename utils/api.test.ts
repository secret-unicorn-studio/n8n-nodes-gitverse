import axios from 'axios';
import {
	createApiClient,
	encodeContent,
	decodeContent,
	buildPaginationParams,
	fetchAllPages,
} from './api';

describe('utils/api', () => {
	describe('createApiClient', () => {
		let mockAxiosInstance: any;
		let createSpy: jest.SpyInstance;

		beforeEach(() => {
			mockAxiosInstance = {
				interceptors: {
					response: {
						use: jest.fn(),
					},
				},
			};
			createSpy = jest
				.spyOn(axios, 'create')
				.mockReturnValue(mockAxiosInstance);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should strip trailing slashes from baseUrl', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru/',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://gitverse.ru',
				})
			);
		});

		it('should handle multiple trailing slashes', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru///',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://gitverse.ru',
				})
			);
		});

		it('should set Authorization header with token', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'my-secret-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'token my-secret-token',
					}),
				})
			);
		});

		it('should set Accept header', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Accept: 'application/json',
					}),
				})
			);
		});

		it('should set timeout to 30000ms', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					timeout: 30000,
				})
			);
		});

		it('should return the axios instance', () => {
			const client = createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'test-token',
			});

			expect(client).toBe(mockAxiosInstance);
		});

		it('should register a response error interceptor', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'test-token',
			});

			expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('should pass successful responses through untouched', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru',
				token: 'test-token',
			});
			const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
			const successHandler = useMock.mock.calls[0][0];
			const response = { status: 200, data: { ok: true } };

			expect(successHandler(response)).toBe(response);
		});

		describe('error interceptor', () => {
			let errorHandler: (error: any) => Promise<any>;

			beforeEach(() => {
				createApiClient({
					baseUrl: 'https://gitverse.ru',
					token: 'test-token',
				});
				const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
				errorHandler = useMock.mock.calls[0][1];
			});

			it('should prefix plain string error payloads', async () => {
				const error: any = {
					response: { status: 404, data: 'not found' },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 404] not found');
			});

			it('should prefer the message field', async () => {
				const error: any = {
					response: { status: 401, data: { message: 'Unauthorized' } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 401] Unauthorized');
			});

			it('should fall back to the error field', async () => {
				const error: any = {
					response: { status: 422, data: { error: 'Validation failed' } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 422] Validation failed');
			});

			it('should stringify unknown payload shapes', async () => {
				const error: any = {
					response: { status: 500, data: { detail: 'boom' } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 500] {"detail":"boom"}');
			});

			it('should keep the original message when there is no payload', async () => {
				const error: any = { message: 'Network Error' };

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('Network Error');
			});

			it('should keep the original message for empty payloads', async () => {
				const error: any = {
					response: { status: 502, data: '' },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('Request failed');
			});
		});
	});

	describe('encodeContent', () => {
		it('should return raw string for non-binary content', () => {
			const result = encodeContent('hello world', false);
			expect(result).toBe('hello world');
		});

		it('should default to non-binary content', () => {
			const result = encodeContent('hello world');
			expect(result).toBe('hello world');
		});

		it('should return base64-encoded string for binary content', () => {
			const result = encodeContent('hello world', true);
			expect(result).toBe(Buffer.from('hello world').toString('base64'));
		});

		it('should handle empty string', () => {
			const result = encodeContent('', true);
			expect(result).toBe('');
		});

		it('should handle unicode characters', () => {
			const result = encodeContent('Привет мир', true);
			expect(result).toBe(Buffer.from('Привет мир').toString('base64'));
		});
	});

	describe('decodeContent', () => {
		it('should return raw string for utf-8 encoding', () => {
			const result = decodeContent('hello world', 'utf-8');
			expect(result).toBe('hello world');
		});

		it('should decode base64 content', () => {
			const base64 = Buffer.from('hello world').toString('base64');
			const result = decodeContent(base64, 'base64');
			expect(result).toBe('hello world');
		});

		it('should handle default encoding (utf-8)', () => {
			const result = decodeContent('hello world');
			expect(result).toBe('hello world');
		});

		it('should decode unicode base64 content', () => {
			const base64 = Buffer.from('Привет мир').toString('base64');
			const result = decodeContent(base64, 'base64');
			expect(result).toBe('Привет мир');
		});
	});

	describe('buildPaginationParams', () => {
		it('should return default params', () => {
			const result = buildPaginationParams();
			expect(result).toEqual({ page: 1, perPage: 50 });
		});

		it('should use custom page', () => {
			const result = buildPaginationParams(5);
			expect(result).toEqual({ page: 5, perPage: 50 });
		});

		it('should use custom perPage', () => {
			const result = buildPaginationParams(1, 100);
			expect(result).toEqual({ page: 1, perPage: 100 });
		});

		it('should use both custom values', () => {
			const result = buildPaginationParams(3, 25);
			expect(result).toEqual({ page: 3, perPage: 25 });
		});
	});

	describe('fetchAllPages', () => {
		function createClient() {
			return { get: jest.fn() };
		}

		function makeItems(count: number, offset = 0) {
			return Array.from({ length: count }, (_, i) => ({ id: offset + i }));
		}

		it('should stop after a single partial page', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [{ id: 1 }], headers: {} });

			const result = await fetchAllPages(client as any, '/api/v1/repos');

			expect(client.get).toHaveBeenCalledTimes(1);
			expect(client.get).toHaveBeenCalledWith('/api/v1/repos', {
				params: { page: 1, perPage: 50 },
			});
			expect(result).toEqual({
				items: [{ id: 1 }],
				totalCount: 1,
				page: 1,
				perPage: 50,
				hasMore: false,
			});
		});

		it('should follow pages until total count is reached', async () => {
			const client = createClient();
			client.get
				.mockResolvedValueOnce({
					data: makeItems(50),
					headers: { 'x-total-count': '60' },
				})
				.mockResolvedValueOnce({
					data: makeItems(10, 50),
					headers: { 'x-total-count': '60' },
				});

			const result = await fetchAllPages(client as any, '/api/v1/commits');

			expect(client.get).toHaveBeenCalledTimes(2);
			expect(client.get).toHaveBeenNthCalledWith(2, '/api/v1/commits', {
				params: { page: 2, perPage: 50 },
			});
			expect(result.items).toHaveLength(60);
			expect(result.totalCount).toBe(60);
			expect(result.hasMore).toBe(false);
		});

		it('should fall back to item count when x-total-count is absent', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: makeItems(50), headers: {} });

			const result = await fetchAllPages(client as any, '/api/v1/commits');

			expect(client.get).toHaveBeenCalledTimes(1);
			expect(result.totalCount).toBe(50);
		});

		it('should handle an empty response body', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: undefined, headers: {} });

			const result = await fetchAllPages(client as any, '/api/v1/commits');

			expect(result).toEqual({
				items: [],
				totalCount: 0,
				page: 1,
				perPage: 50,
				hasMore: false,
			});
		});

		it('should forward extra request config', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [], headers: {} });

			await fetchAllPages(client as any, '/api/v1/commits', {
				headers: { 'X-Custom': 'value' },
			});

			expect(client.get).toHaveBeenCalledWith('/api/v1/commits', {
				params: { page: 1, perPage: 50 },
				headers: { 'X-Custom': 'value' },
			});
		});
	});
});
