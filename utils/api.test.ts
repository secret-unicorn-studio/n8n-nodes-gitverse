import axios from 'axios';
import {
	GITVERSE_ACCEPT_HEADER,
	createApiClient,
	encodeContent,
	decodeContent,
	buildPaginationParams,
	fetchPages,
	normalizeBaseUrl,
	parseLinkHeader,
	getLastPage,
	extractErrorMessage,
} from './api';

describe('utils/api', () => {
	describe('normalizeBaseUrl', () => {
		it('should fall back to the public API host for empty values', () => {
			expect(normalizeBaseUrl('')).toBe('https://api.gitverse.ru');
			expect(normalizeBaseUrl('   ')).toBe('https://api.gitverse.ru');
			expect(normalizeBaseUrl(undefined as unknown as string)).toBe(
				'https://api.gitverse.ru'
			);
		});

		it('should strip trailing slashes', () => {
			expect(normalizeBaseUrl('https://api.gitverse.ru/')).toBe(
				'https://api.gitverse.ru'
			);
			expect(normalizeBaseUrl('https://api.gitverse.ru///')).toBe(
				'https://api.gitverse.ru'
			);
		});

		it('should rewrite the web host to the API host', () => {
			expect(normalizeBaseUrl('https://gitverse.ru')).toBe(
				'https://api.gitverse.ru'
			);
			expect(normalizeBaseUrl('https://www.gitverse.ru')).toBe(
				'https://api.gitverse.ru'
			);
		});

		it('should drop the legacy /api/v1 prefix of the web host', () => {
			expect(normalizeBaseUrl('https://gitverse.ru/api/v1')).toBe(
				'https://api.gitverse.ru'
			);
			expect(normalizeBaseUrl('http://gitverse.ru/api/v1/')).toBe(
				'http://api.gitverse.ru'
			);
		});

		it('should keep self-hosted base URLs untouched', () => {
			expect(normalizeBaseUrl('https://git.sustudio.ru/api/v1')).toBe(
				'https://git.sustudio.ru/api/v1'
			);
		});

		it('should return unparsable values as-is', () => {
			expect(normalizeBaseUrl('not a url')).toBe('not a url');
		});
	});

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
				request: jest.fn(),
			};
			createSpy = jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);
		});

		afterEach(() => {
			jest.restoreAllMocks();
		});

		it('should normalize the baseUrl', () => {
			createApiClient({
				baseUrl: 'https://gitverse.ru/api/v1/',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					baseURL: 'https://api.gitverse.ru',
				})
			);
		});

		it('should set the Bearer authorization header', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'my-secret-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer my-secret-token',
					}),
				})
			);
		});

		it('should set the versioned Accept header', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Accept: GITVERSE_ACCEPT_HEADER,
					}),
				})
			);
		});

		it('should default the timeout to 30000ms', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					timeout: 30000,
				})
			);
		});

		it('should accept a custom timeout', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
				timeout: 5000,
			});

			expect(createSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					timeout: 5000,
				})
			);
		});

		it('should return the axios instance', () => {
			const client = createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
			});

			expect(client).toBe(mockAxiosInstance);
		});

		it('should register a response error interceptor', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
			});

			expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalledWith(
				expect.any(Function),
				expect.any(Function)
			);
		});

		it('should pass successful responses through untouched', () => {
			createApiClient({
				baseUrl: 'https://api.gitverse.ru',
				token: 'test-token',
			});
			const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
			const successHandler = useMock.mock.calls[0][0];
			const response = { status: 200, data: { ok: true } };

			expect(successHandler(response)).toBe(response);
		});

		describe('error interceptor', () => {
			let errorHandler: (error: any) => Promise<any>;

			function setup(options: Record<string, unknown> = {}) {
				createApiClient({
					baseUrl: 'https://api.gitverse.ru',
					token: 'test-token',
					retryDelayMs: () => 0,
					...options,
				});
				const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
				errorHandler = useMock.mock.calls[useMock.mock.calls.length - 1][1];
			}

			beforeEach(() => {
				setup();
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

			it('should unwrap the nested Gitverse error object', async () => {
				const error: any = {
					response: {
						status: 404,
						data: {
							error: {
								code: 'NOT_FOUND',
								message: 'Not found',
								documentation_url: 'https://gitverse.ru/docs/developers/public-api',
								status: 404,
							},
						},
					},
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 404] NOT_FOUND: Not found');
			});

			it('should use the nested error message without a code', async () => {
				const error: any = {
					response: { status: 404, data: { error: { message: 'Not found' } } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 404] Not found');
			});

			it('should fall back to a flat message when the nested error is empty', async () => {
				const error: any = {
					response: { status: 422, data: { error: {}, message: 'flat' } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 422] flat');
			});

			it('should stringify a nested error without a message', async () => {
				const error: any = {
					response: { status: 422, data: { error: { code: 'X' } } },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 422] {"error":{"code":"X"}}');
			});

			it('should stringify primitive payloads', async () => {
				const error: any = {
					response: { status: 500, data: 42 },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('[Gitverse 500] 42');
			});

			it('should keep the original message for whitespace-only payloads', async () => {
				const error: any = {
					response: { status: 500, data: '   ' },
					message: 'Request failed',
				};

				await expect(errorHandler(error)).rejects.toBe(error);
				expect(error.message).toBe('Request failed');
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

			it('should retry retryable statuses and resolve', async () => {
				const config: any = { url: '/repos/owner/repo' };
				mockAxiosInstance.request.mockResolvedValue({ data: { ok: true } });

				const result = await errorHandler({
					config,
					response: { status: 503, headers: {} },
				});

				expect(mockAxiosInstance.request).toHaveBeenCalledWith(config);
				expect(config.__gitverseAttempt).toBe(1);
				expect(result).toEqual({ data: { ok: true } });
			});

			it('should retry 429 responses', async () => {
				const config: any = { url: '/user/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				await errorHandler({
					config,
					response: { status: 429, headers: {} },
				});

				expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
			});

			it('should stop retrying once the attempt budget is used up', async () => {
				const config: any = { url: '/repos', __gitverseAttempt: 3 };

				await expect(
					errorHandler({
						config,
						response: { status: 500, headers: {}, data: { message: 'boom' } },
					})
				).rejects.toMatchObject({ message: '[Gitverse 500] boom' });

				expect(mockAxiosInstance.request).not.toHaveBeenCalled();
			});

			it('should not retry non-retryable statuses', async () => {
				const config: any = { url: '/repos' };

				await expect(
					errorHandler({
						config,
						response: { status: 404, headers: {}, data: { message: 'nope' } },
					})
				).rejects.toMatchObject({ message: '[Gitverse 404] nope' });

				expect(mockAxiosInstance.request).not.toHaveBeenCalled();
			});

			it('should not retry when retries are disabled', async () => {
				setup({ retries: 0 });
				const config: any = { url: '/repos' };

				await expect(
					errorHandler({
						config,
						response: { status: 500, headers: {}, data: { message: 'boom' } },
					})
				).rejects.toMatchObject({ message: '[Gitverse 500] boom' });

				expect(mockAxiosInstance.request).not.toHaveBeenCalled();
			});

			it('should not retry when the request config is missing', async () => {
				await expect(
					errorHandler({ response: { status: 503, headers: {}, data: 'down' } })
				).rejects.toMatchObject({ message: '[Gitverse 503] down' });
			});

			it('should retry when the response carries no headers', async () => {
				const config: any = { url: '/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				await errorHandler({ config, response: { status: 503 } });

				expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
			});

			it('should honor the Retry-After header', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);
				setup({ retryDelayMs: delaySpy });
				const config: any = { url: '/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				await errorHandler({
					config,
					response: { status: 429, headers: { 'retry-after': '7' } },
				});

				expect(delaySpy).toHaveBeenCalledWith(1, 7000);
			});

			it('should parse an HTTP-date Retry-After header', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);
				setup({ retryDelayMs: delaySpy });
				const config: any = { url: '/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });
				const future = new Date(Date.now() + 5000).toUTCString();

				await errorHandler({
					config,
					response: { status: 429, headers: { 'retry-after': future } },
				});

				expect(delaySpy).toHaveBeenCalledTimes(1);
				expect(delaySpy.mock.calls[0][1]).toBeGreaterThan(0);
			});

			it('should ignore an unparsable Retry-After header', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);
				setup({ retryDelayMs: delaySpy });
				const config: any = { url: '/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				await errorHandler({
					config,
					response: { status: 429, headers: { 'retry-after': 'later' } },
				});

				expect(delaySpy).toHaveBeenCalledWith(1, null);
			});

			it('should use exponential backoff by default', async () => {
				createApiClient({
					baseUrl: 'https://api.gitverse.ru',
					token: 'test-token',
				});
				const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
				const handler = useMock.mock.calls[useMock.mock.calls.length - 1][1];
				const config: any = { url: '/repos', __gitverseAttempt: 1 };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				jest.useFakeTimers();
				const pending = handler({
					config,
					response: { status: 503, headers: {} },
				});
				await jest.advanceTimersByTimeAsync(2000);
				await expect(pending).resolves.toEqual({ data: [] });
				jest.useRealTimers();
			});

			it('should wait at least as long as the Retry-After header asks', async () => {
				createApiClient({
					baseUrl: 'https://api.gitverse.ru',
					token: 'test-token',
				});
				const useMock = mockAxiosInstance.interceptors.response.use as jest.Mock;
				const handler = useMock.mock.calls[useMock.mock.calls.length - 1][1];
				const config: any = { url: '/repos' };
				mockAxiosInstance.request.mockResolvedValue({ data: [] });

				jest.useFakeTimers();
				const pending = handler({
					config,
					response: { status: 429, headers: { 'retry-after': '5' } },
				});
				await jest.advanceTimersByTimeAsync(5000);
				await expect(pending).resolves.toEqual({ data: [] });
				jest.useRealTimers();
			});
		});
	});

	describe('extractErrorMessage', () => {
		it('should return null without a payload', () => {
			expect(extractErrorMessage(undefined)).toBeNull();
			expect(extractErrorMessage(null)).toBeNull();
			expect(extractErrorMessage('')).toBeNull();
		});

		it('should return plain strings untouched', () => {
			expect(extractErrorMessage('not found')).toBe('not found');
		});

		it('should read flat messages', () => {
			expect(extractErrorMessage({ message: 'Unauthorized' })).toBe('Unauthorized');
		});

		it('should read nested Gitverse errors with a code', () => {
			expect(
				extractErrorMessage({ error: { code: 'NOT_FOUND', message: 'Not found' } })
			).toBe('NOT_FOUND: Not found');
		});

		it('should read nested Gitverse errors without a code', () => {
			expect(extractErrorMessage({ error: { message: 'Not found' } })).toBe('Not found');
		});

		it('should stringify payloads it cannot interpret', () => {
			expect(extractErrorMessage({ detail: 'boom' })).toBe('{"detail":"boom"}');
		});
	});

	describe('parseLinkHeader', () => {
		it('should return an empty map without a header', () => {
			expect(parseLinkHeader()).toEqual({});
			expect(parseLinkHeader('')).toEqual({});
		});

		it('should parse multiple relations', () => {
			const header =
				'<https://gitverse.ru/public/api/repos/o/r/commits?page=2&per_page=2>; rel="next",<https://gitverse.ru/public/api/repos/o/r/commits?page=555&per_page=2>; rel="last"';

			expect(parseLinkHeader(header)).toEqual({
				next: 'https://gitverse.ru/public/api/repos/o/r/commits?page=2&per_page=2',
				last: 'https://gitverse.ru/public/api/repos/o/r/commits?page=555&per_page=2',
			});
		});

		it('should accept unquoted relation values', () => {
			expect(parseLinkHeader('<https://api.gitverse.ru/x?page=2>; rel=next')).toEqual({
				next: 'https://api.gitverse.ru/x?page=2',
			});
		});

		it('should skip malformed parts', () => {
			expect(parseLinkHeader('garbage')).toEqual({});
		});
	});

	describe('getLastPage', () => {
		it('should return Infinity without a header', () => {
			expect(getLastPage()).toBe(Infinity);
		});

		it('should read the page of the last relation', () => {
			expect(
				getLastPage('<https://x/y?page=1&per_page=2>; rel="first",<https://x/y?page=9>; rel="last"')
			).toBe(9);
		});

		it('should return Infinity when the last relation has no page param', () => {
			expect(getLastPage('<https://x/y>; rel="last"')).toBe(Infinity);
		});
	});

	describe('buildPaginationParams', () => {
		it('should return default params', () => {
			expect(buildPaginationParams()).toEqual({ page: 1, per_page: 50 });
		});

		it('should use custom values', () => {
			expect(buildPaginationParams(5, 25)).toEqual({ page: 5, per_page: 25 });
		});

		it('should clamp per_page to the supported range', () => {
			expect(buildPaginationParams(1, 500)).toEqual({ page: 1, per_page: 100 });
			expect(buildPaginationParams(1, 0)).toEqual({ page: 1, per_page: 50 });
			expect(buildPaginationParams(1, -5)).toEqual({ page: 1, per_page: 1 });
			expect(buildPaginationParams(1, Number.NaN)).toEqual({
				page: 1,
				per_page: 50,
			});
		});
	});

	describe('fetchPages', () => {
		function createClient() {
			return { get: jest.fn() };
		}

		it('should request a single page by default', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await fetchPages(client as any, '/repos/o/r/commits');

			expect(client.get).toHaveBeenCalledWith('/repos/o/r/commits', {
				params: { page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should pass through extra params and config', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [] });

			await fetchPages(client as any, '/repos/o/r/pulls', {
				params: { state: 'open' },
				config: { headers: { 'X-Custom': 'value' } },
				perPage: 10,
			});

			expect(client.get).toHaveBeenCalledWith('/repos/o/r/pulls', {
				headers: { 'X-Custom': 'value' },
				params: { state: 'open', page: 1, per_page: 10 },
			});
		});

		it('should cap a single page to the limit', async () => {
			const client = createClient();
			client.get.mockResolvedValue({
				data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
			});

			const result = await fetchPages(client as any, '/repos/o/r/commits', {
				limit: 5,
			});

			expect(client.get).toHaveBeenCalledWith('/repos/o/r/commits', {
				params: { page: 1, per_page: 5 },
			});
			expect(result).toHaveLength(5);
		});

		it('should return an empty array for a non-array payload', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: { message: 'nope' } });

			expect(await fetchPages(client as any, '/repos/o/r/commits')).toEqual([]);
		});

		it('should follow pages until a short page is returned', async () => {
			const client = createClient();
			client.get
				.mockResolvedValueOnce({
					data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
					headers: {},
				})
				.mockResolvedValueOnce({
					data: Array.from({ length: 10 }, (_, i) => ({ id: 50 + i })),
					headers: {},
				});

			const result = await fetchPages(client as any, '/repos/o/r/commits', {
				returnAll: true,
			});

			expect(client.get).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(60);
		});

		it('should stop at the last page advertised by the Link header', async () => {
			const client = createClient();
			client.get.mockResolvedValue({
				data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
				headers: {
					link: '<https://gitverse.ru/public/api/repos/o/r/commits?page=2&per_page=50>; rel="next",<https://gitverse.ru/public/api/repos/o/r/commits?page=2&per_page=50>; rel="last"',
				},
			});

			const result = await fetchPages(client as any, '/repos/o/r/commits', {
				returnAll: true,
			});

			expect(client.get).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(100);
		});

		it('should stop as soon as the limit is reached', async () => {
			const client = createClient();
			client.get.mockResolvedValue({
				data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
				headers: {},
			});

			const result = await fetchPages(client as any, '/repos/o/r/commits', {
				returnAll: true,
				limit: 60,
				perPage: 50,
			});

			expect(client.get).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(60);
		});

		it('should return an empty array when the first page is empty', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [], headers: {} });

			expect(
				await fetchPages(client as any, '/repos/o/r/commits', { returnAll: true })
			).toEqual([]);
			expect(client.get).toHaveBeenCalledTimes(1);
		});

		it('should follow pages when the response carries no headers', async () => {
			const client = createClient();
			client.get
				.mockResolvedValueOnce({
					data: Array.from({ length: 50 }, (_, i) => ({ id: i })),
				})
				.mockResolvedValueOnce({ data: [{ id: 99 }] });

			const result = await fetchPages(client as any, '/repos/o/r/commits', {
				returnAll: true,
			});

			expect(client.get).toHaveBeenCalledTimes(2);
			expect(result).toHaveLength(51);
		});
	});

	describe('encodeContent', () => {
		it('should return raw string for non-binary content', () => {
			expect(encodeContent('hello world', false)).toBe('hello world');
		});

		it('should default to non-binary content', () => {
			expect(encodeContent('hello world')).toBe('hello world');
		});

		it('should return base64-encoded string for binary content', () => {
			expect(encodeContent('hello world', true)).toBe(
				Buffer.from('hello world').toString('base64')
			);
		});

		it('should handle empty string', () => {
			expect(encodeContent('', true)).toBe('');
		});

		it('should handle unicode characters', () => {
			expect(encodeContent('Привет мир', true)).toBe(
				Buffer.from('Привет мир').toString('base64')
			);
		});
	});

	describe('decodeContent', () => {
		it('should return raw string for utf-8 encoding', () => {
			expect(decodeContent('hello world', 'utf-8')).toBe('hello world');
		});

		it('should decode base64 content', () => {
			const base64 = Buffer.from('hello world').toString('base64');
			expect(decodeContent(base64, 'base64')).toBe('hello world');
		});

		it('should handle default encoding (utf-8)', () => {
			expect(decodeContent('hello world')).toBe('hello world');
		});

		it('should decode unicode base64 content', () => {
			const base64 = Buffer.from('Привет мир').toString('base64');
			expect(decodeContent(base64, 'base64')).toBe('Привет мир');
		});
	});
});
