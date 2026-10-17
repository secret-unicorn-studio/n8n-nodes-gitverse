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
	GitverseApiError,
	isGitverseError,
	buildMultipartBody,
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
		let httpRequest: jest.Mock;
		let context: { helpers: { httpRequest: jest.Mock } };

		function response(status: number, body: unknown, headers: Record<string, any> = {}) {
			return { statusCode: status, body, headers };
		}

		function client(options: Record<string, unknown> = {}) {
			return createApiClient(context, {
				baseUrl: 'https://gitverse.ru/api/v1/',
				token: 'test-token',
				retryDelayMs: () => 0,
				...options,
			});
		}

		beforeEach(() => {
			httpRequest = jest.fn().mockResolvedValue(response(200, { ok: true }));
			context = { helpers: { httpRequest } };
		});

		it('should normalize the base URL and join it with the path', async () => {
			await client().get('/repos/o/r');

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ url: 'https://api.gitverse.ru/repos/o/r', method: 'GET' })
			);
		});

		it('should keep a self-hosted base URL', async () => {
			await client({ baseUrl: 'https://git.example.com/api/v1' }).get('/user');

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ url: 'https://git.example.com/api/v1/user' })
			);
		});

		it('should send the bearer token and the versioned accept header', async () => {
			await client().get('/user');

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
						Accept: GITVERSE_ACCEPT_HEADER,
					}),
				})
			);
		});

		it('should default the timeout to 30000ms and accept a custom one', async () => {
			await client().get('/user');
			expect(httpRequest).toHaveBeenCalledWith(expect.objectContaining({ timeout: 30000 }));

			await client({ timeout: 5000 }).get('/user');
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ timeout: 5000 })
			);
		});

		it('should return the body, the status and lower-cased headers', async () => {
			httpRequest.mockResolvedValue(
				response(201, { id: 1 }, { 'Link': 'x', 'Content-Type': 'application/json' })
			);

			const result = await client().post('/repos', { name: 'one' });

			expect(result).toEqual({
				data: { id: 1 },
				status: 201,
				headers: { link: 'x', 'content-type': 'application/json' },
			});
		});

		it('should tolerate a response without headers or status', async () => {
			httpRequest.mockResolvedValue({ body: [] });

			expect(await client().get('/repos')).toEqual({ data: [], status: 200, headers: {} });
		});

		it('should send query parameters', async () => {
			await client().get('/repos', { params: { page: 2, per_page: 10 } });

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({ qs: { page: 2, per_page: 10 } })
			);
		});

		it('should merge extra headers over the defaults', async () => {
			await client().post('/x', Buffer.from('body'), {
				headers: { 'Content-Type': 'multipart/form-data; boundary=abc' },
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
						'Content-Type': 'multipart/form-data; boundary=abc',
					}),
				})
			);
		});

		it('should pass the body of every write method', async () => {
			const api = client();

			await api.post('/a', { one: 1 });
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ method: 'POST', body: { one: 1 } })
			);

			await api.put('/b', { two: 2 });
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ method: 'PUT', body: { two: 2 } })
			);

			await api.patch('/c', { three: 3 });
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ method: 'PATCH', body: { three: 3 } })
			);

			await api.delete('/d', { data: { four: 4 } });
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ method: 'DELETE', body: { four: 4 } })
			);

			await api.delete('/e');
			expect(httpRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ method: 'DELETE', body: undefined })
			);
		});

		it('should send GET requests without a body', async () => {
			await client().get('/user');

			expect(httpRequest).toHaveBeenCalledWith(expect.objectContaining({ body: undefined }));
		});

		it('should forward the redirect and encoding options', async () => {
			await client().get('/zip', { disableFollowRedirect: true, encoding: 'arraybuffer' });

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					disableFollowRedirect: true,
					encoding: 'arraybuffer',
				})
			);
		});

		it('should always ask for the full response and handle the status itself', async () => {
			await client().get('/user');

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					returnFullResponse: true,
					ignoreHttpStatusErrors: true,
				})
			);
		});

		it('should expose a request method', async () => {
			await client().request({ method: 'POST', url: '/x', data: { a: 1 }, params: { b: 2 } });

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: 'https://api.gitverse.ru/x',
					body: { a: 1 },
					qs: { b: 2 },
				})
			);
		});

		describe('errors', () => {
			it('should throw a GitverseApiError for a failed request', async () => {
				httpRequest.mockResolvedValue(
					response(404, {
						error: { code: 'NOT_FOUND', message: 'Not found', status: 404 },
					})
				);

				await expect(client().get('/repos/o/r')).rejects.toMatchObject({
					name: 'GitverseApiError',
					status: 404,
					message: '[Gitverse 404] NOT_FOUND: Not found',
				});
			});

			it('should carry the body, the headers and the axios-like response', async () => {
				const body = { error: { code: 'X', message: 'y' } };

				httpRequest.mockResolvedValue(response(422, body, { 'X-Trace': '1' }));

				try {
					await client().get('/x');
					throw new Error('should have thrown');
				} catch (error) {
					expect(error).toBeInstanceOf(GitverseApiError);
					const apiError = error as GitverseApiError;

					expect(apiError.body).toEqual(body);
					expect(apiError.headers).toEqual({ 'x-trace': '1' });
					expect(apiError.response).toEqual({
						status: 422,
						data: body,
						headers: { 'x-trace': '1' },
					});
				}
			});

			it('should describe an error without a payload', async () => {
				httpRequest.mockResolvedValue({ statusCode: 500, body: '', headers: {} });

				await expect(client().get('/x')).rejects.toThrow('[Gitverse 500] Request failed');
			});

			it('should not retry a non-retryable status', async () => {
				httpRequest.mockResolvedValue(response(404, { message: 'nope' }));

				await expect(client().get('/x')).rejects.toThrow('[Gitverse 404] nope');
				expect(httpRequest).toHaveBeenCalledTimes(1);
			});

			it('should not retry when retries are disabled', async () => {
				httpRequest.mockResolvedValue(response(503, { message: 'down' }));

				await expect(client({ retries: 0 }).get('/x')).rejects.toThrow('[Gitverse 503] down');
				expect(httpRequest).toHaveBeenCalledTimes(1);
			});

			it('should retry a retryable status until it succeeds', async () => {
				httpRequest
					.mockResolvedValueOnce(response(503, 'down'))
					.mockResolvedValueOnce(response(429, 'slow'))
					.mockResolvedValueOnce(response(200, { ok: true }));

				await expect(client().get('/x')).resolves.toMatchObject({ data: { ok: true } });
				expect(httpRequest).toHaveBeenCalledTimes(3);
			});

			it('should give up once the retry budget is used up', async () => {
				httpRequest.mockResolvedValue(response(500, { message: 'boom' }));

				await expect(client({ retries: 2 }).get('/x')).rejects.toThrow(
					'[Gitverse 500] boom'
				);
				expect(httpRequest).toHaveBeenCalledTimes(3);
			});

			it('should retry every server error status', async () => {
				for (const status of [429, 500, 502, 503, 504]) {
					httpRequest.mockClear();
					httpRequest
						.mockResolvedValueOnce(response(status, 'x'))
						.mockResolvedValueOnce(response(200, 'ok'));

					await expect(client().get('/x')).resolves.toMatchObject({ data: 'ok' });
				}
			});

			it('should honor the Retry-After header in seconds', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);

				httpRequest
					.mockResolvedValueOnce(response(429, 'x', { 'Retry-After': '7' }))
					.mockResolvedValueOnce(response(200, 'ok'));

				await client({ retryDelayMs: delaySpy }).get('/x');

				expect(delaySpy).toHaveBeenCalledWith(1, 7000);
			});

			it('should parse an HTTP-date Retry-After header', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);
				const future = new Date(Date.now() + 5000).toUTCString();

				httpRequest
					.mockResolvedValueOnce(response(429, 'x', { 'retry-after': future }))
					.mockResolvedValueOnce(response(200, 'ok'));

				await client({ retryDelayMs: delaySpy }).get('/x');

				expect(delaySpy).toHaveBeenCalledTimes(1);
				expect(delaySpy.mock.calls[0][1]).toBeGreaterThan(0);
			});

			it('should pass null for an unparsable Retry-After header', async () => {
				const delaySpy = jest.fn().mockReturnValue(0);

				httpRequest
					.mockResolvedValueOnce(response(429, 'x', { 'retry-after': 'later' }))
					.mockResolvedValueOnce(response(200, 'ok'));

				await client({ retryDelayMs: delaySpy }).get('/x');

				expect(delaySpy).toHaveBeenCalledWith(1, null);
			});

			it('should use exponential backoff by default', async () => {
				httpRequest
					.mockResolvedValueOnce(response(503, 'x'))
					.mockResolvedValueOnce(response(200, 'ok'));

				jest.useFakeTimers();

				try {
					const pending = client({ retryDelayMs: undefined }).get('/x');

					await jest.advanceTimersByTimeAsync(2000);
					await expect(pending).resolves.toMatchObject({ data: 'ok' });
				} finally {
					jest.useRealTimers();
				}
			});
		});
	});

	describe('buildMultipartBody', () => {
		it('should build a single file part with a deterministic boundary', () => {
			const { body, contentType } = buildMultipartBody(
				[
					{
						name: 'attachment',
						value: Buffer.from('payload'),
						fileName: 'error.log',
						contentType: 'text/plain',
					},
				],
				'BOUNDARY'
			);

			expect(contentType).toBe('multipart/form-data; boundary=BOUNDARY');
			expect(body.toString('utf8')).toBe(
				[
					'--BOUNDARY',
					'Content-Disposition: form-data; name="attachment"; filename="error.log"',
					'Content-Type: text/plain',
					'',
					'payload',
					'--BOUNDARY--',
					'',
				].join('\r\n')
			);
		});

		it('should build a plain field before the file', () => {
			const { body } = buildMultipartBody(
				[
					{ name: 'name', value: 'asset.zip' },
					{ name: 'attachment', value: Buffer.from('zip'), fileName: 'a.zip' },
				],
				'BOUNDARY'
			);
			const text = body.toString('utf8');

			expect(text).toContain('Content-Disposition: form-data; name="name"\r\n\r\nasset.zip');
			expect(text).toContain('filename="a.zip"');
			expect(text).toContain('Content-Type: application/octet-stream');
		});

		it('should keep binary content untouched', () => {
			const payload = Buffer.from([0x00, 0x01, 0xff, 0xfe]);
			const { body } = buildMultipartBody(
				[{ name: 'attachment', value: payload, fileName: 'blob.bin' }],
				'BOUNDARY'
			);

			expect(body.includes(payload)).toBe(true);
		});

		it('should generate a random boundary by default', () => {
			const first = buildMultipartBody([{ name: 'a', value: 'b' }]);
			const second = buildMultipartBody([{ name: 'a', value: 'b' }]);

			expect(first.contentType).toMatch(/^multipart\/form-data; boundary=----n8nGitverse[0-9a-f]{32}$/);
			expect(first.contentType).not.toBe(second.contentType);
		});

		it('should neutralize quotes and line breaks in names', () => {
			const { body } = buildMultipartBody(
				[{ name: 'a"b', value: 'x', fileName: 'e\r\nvil.txt' }],
				'BOUNDARY'
			);
			const text = body.toString('utf8');

			expect(text).toContain('name="a%22b"');
			expect(text).toContain('filename="e vil.txt"');
		});

		it('should keep an explicit content type of a plain field', () => {
			const { body } = buildMultipartBody(
				[{ name: 'meta', value: '{}', contentType: 'application/json' }],
				'BOUNDARY'
			);
			const text = body.toString('utf8');

			expect(text).toContain('Content-Disposition: form-data; name="meta"');
			expect(text).toContain('Content-Type: application/json\r\n\r\n{}');
		});
	});

	describe('isGitverseError', () => {
		it('should recognize a Gitverse error and its status', () => {
			const error = new GitverseApiError(404, { message: 'nope' });

			expect(isGitverseError(error)).toBe(true);
			expect(isGitverseError(error, 404)).toBe(true);
			expect(isGitverseError(error, 500)).toBe(false);
		});

		it('should reject other errors', () => {
			expect(isGitverseError(new Error('boom'))).toBe(false);
			expect(isGitverseError({ response: { status: 404 } })).toBe(false);
			expect(isGitverseError(undefined)).toBe(false);
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

		it('should stringify primitive payloads', () => {
			expect(extractErrorMessage(42)).toBe('42');
			expect(extractErrorMessage(true)).toBe('true');
		});

		it('should read a nested error that is a plain string', () => {
			expect(extractErrorMessage({ error: 'Validation failed' })).toBe('Validation failed');
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

		it('should rename the parameters on demand', () => {
			expect(buildPaginationParams(2, 30, 'page', 'limit')).toEqual({ page: 2, limit: 30 });
			expect(buildPaginationParams(1, 10, 'offset')).toEqual({ offset: 1, per_page: 10 });
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

		it('should honour custom pagination parameter names', async () => {
			const client = createClient();
			client.get.mockResolvedValue({ data: [] });

			await fetchPages(client as any, '/repos/o/r/pulls/1/reviews', {
				perPage: 30,
				pageParam: 'offset',
				perPageParam: 'limit',
			});

			expect(client.get).toHaveBeenCalledWith('/repos/o/r/pulls/1/reviews', {
				params: { offset: 1, limit: 30 },
			});
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
