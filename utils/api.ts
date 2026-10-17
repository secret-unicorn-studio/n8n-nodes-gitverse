import { randomBytes } from 'node:crypto';

import { IDataObject, IHttpRequestMethods, IHttpRequestOptions } from 'n8n-workflow';

/** Media type required by the Gitverse public API. Requests without it fail with HTTP 415. */
export const GITVERSE_ACCEPT_HEADER =
	'application/vnd.gitverse.object+json;version=1';

/** Public Gitverse API host. Note: there is no `/api/v1` prefix here. */
export const DEFAULT_BASE_URL = 'https://api.gitverse.ru';

export const DEFAULT_PER_PAGE = 50;

/** Gitverse rejects `per_page` values above 100. */
export const MAX_PER_PAGE = 100;

export const DEFAULT_RETRIES = 3;

/**
 * The web host serves the UI only. All `<rev>/api/v1/...` paths used by earlier
 * versions of this node return 404, so legacy values are rewritten to the API host.
 */
const LEGACY_WEB_HOSTS = ['gitverse.ru', 'www.gitverse.ru'];

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

export interface GitverseCredentials {
	baseUrl: string;
	token: string;
	retries?: number;
}

export interface GitverseApiOptions {
	baseUrl: string;
	token: string;
	retries?: number;
	timeout?: number;
	/** Injectable delay used between retries (tests use a no-op). */
	retryDelayMs?: (attempt: number, retryAfterMs: number | null) => number;
}

/** A Gitverse response, shaped like the axios parts the operations rely on. */
export interface HttpResponse<T = any> {
	data: T;
	status: number;
	headers: Record<string, any>;
}

export interface RequestConfig {
	/** Query parameters. */
	params?: Record<string, unknown>;
	/** Additional headers, merged over the defaults. */
	headers?: Record<string, string>;
	/** Body of a `DELETE`, which axios used to take from the config. */
	data?: unknown;
	/** Keep the redirect response instead of following it (artifact downloads). */
	disableFollowRedirect?: boolean;
	encoding?: IHttpRequestOptions['encoding'];
	timeout?: number;
}

/**
 * The HTTP surface the operations use. It is implemented on top of the n8n request
 * helpers, so no HTTP library is bundled with the package.
 */
export interface GitverseClient {
	request<T = any>(
		config: RequestConfig & { method: IHttpRequestMethods; url: string }
	): Promise<HttpResponse<T>>;
	get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
	post<T = any>(url: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>>;
	put<T = any>(url: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>>;
	patch<T = any>(url: string, body?: unknown, config?: RequestConfig): Promise<HttpResponse<T>>;
	delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>;
}

/** Anything that can perform a request through the n8n helpers. */
export interface HttpRequestContext {
	helpers: {
		httpRequest: (options: IHttpRequestOptions) => Promise<any>;
	};
}

export interface FetchPagesOptions {
	/** Follow every page until the last one. */
	returnAll?: boolean;
	/** Maximum number of items to return (ignored when `returnAll` is false and `limit` is 0). */
	limit?: number;
	perPage?: number;
	/** Query parameter carrying the page number (defaults to `page`). */
	pageParam?: string;
	/** Query parameter carrying the page size (defaults to `per_page`). */
	perPageParam?: string;
	params?: Record<string, unknown>;
	config?: RequestConfig;
}

export interface MultipartPart {
	name: string;
	value: string | Buffer;
	fileName?: string;
	contentType?: string;
}

export interface MultipartBody {
	body: Buffer;
	contentType: string;
}

/**
 * Error thrown for any non-2xx Gitverse response.
 *
 * `response` mirrors the axios error shape the operations and the scripts read.
 */
export class GitverseApiError extends Error {
	readonly status: number;

	readonly body: unknown;

	readonly headers: Record<string, any>;

	readonly response: { status: number; data: unknown; headers: Record<string, any> };

	constructor(status: number, body: unknown, headers: Record<string, any> = {}) {
		const detail = extractErrorMessage(body) ?? 'Request failed';

		super(`[Gitverse ${status}] ${detail}`);

		this.name = 'GitverseApiError';
		this.status = status;
		this.body = body;
		this.headers = headers;
		this.response = { status, data: body, headers };
	}
}

/** Whether the error is a Gitverse response error, optionally with a given status. */
export function isGitverseError(error: unknown, status?: number): error is GitverseApiError {
	return error instanceof GitverseApiError && (status === undefined || error.status === status);
}

/**
 * Normalize a user supplied base URL.
 *
 * Accepts plain hosts (`https://api.gitverse.ru`), legacy values pointing at the
 * web UI (`https://gitverse.ru/api/v1`) and self-hosted instances, where the
 * caller is responsible for any path prefix their instance exposes.
 */
export function normalizeBaseUrl(baseUrl: string): string {
	const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');

	if (!trimmed) {
		return DEFAULT_BASE_URL;
	}

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return trimmed;
	}

	if (LEGACY_WEB_HOSTS.includes(parsed.hostname.toLowerCase())) {
		return `${parsed.protocol}//api.gitverse.ru`;
	}

	return trimmed;
}

function clampPerPage(perPage?: number): number {
	if (!perPage || !Number.isFinite(perPage)) {
		return DEFAULT_PER_PAGE;
	}

	return Math.min(Math.max(Math.trunc(perPage), 1), MAX_PER_PAGE);
}

function toItemArray<T>(data: unknown): T[] {
	return Array.isArray(data) ? (data as T[]) : [];
}

function normalizeHeaders(headers: unknown): Record<string, any> {
	const result: Record<string, any> = {};

	if (headers && typeof headers === 'object') {
		for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
			result[key.toLowerCase()] = value;
		}
	}

	return result;
}

/**
 * Parse an RFC 5988 `Link` header into a map of `rel` -> URL.
 *
 * Only the `page` query parameter of these URLs is used: Gitverse emits links
 * pointing at `https://gitverse.ru/public/api/...`, which does not respond.
 */
export function parseLinkHeader(link?: string): Record<string, string> {
	const result: Record<string, string> = {};

	if (!link) {
		return result;
	}

	for (const part of link.split(',')) {
		const match = part.match(/<([^>]+)>\s*;\s*rel="?([^";]+)"?/);

		if (match) {
			result[match[2].trim()] = match[1].trim();
		}
	}

	return result;
}

/** Extract the page number advertised by `rel="last"`, or `Infinity` when absent. */
export function getLastPage(link?: string): number {
	const last = parseLinkHeader(link).last;

	if (!last) {
		return Infinity;
	}

	const match = last.match(/[?&]page=(\d+)/);

	return match ? parseInt(match[1], 10) : Infinity;
}

function parseRetryAfterMs(headers: Record<string, unknown> | undefined): number | null {
	const raw = headers?.['retry-after'];

	if (raw === undefined || raw === null) {
		return null;
	}

	const asString = String(raw).trim();
	const seconds = Number(asString);

	if (Number.isFinite(seconds)) {
		return Math.max(0, seconds * 1000);
	}

	const date = Date.parse(asString);

	return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function defaultRetryDelay(attempt: number, retryAfterMs: number | null): number {
	const backoff = Math.min(1000 * 2 ** (attempt - 1), 30000);

	return retryAfterMs === null ? backoff : Math.max(backoff, retryAfterMs);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
	return RETRYABLE_STATUSES.includes(status);
}

/**
 * Extract a readable message from a Gitverse error payload.
 *
 * Gitverse nests failures as `{error:{code,message,documentation_url,status}}`;
 * Gitea-compatible endpoints use a flat `{message}` or a plain string.
 */
export function extractErrorMessage(data: unknown): string | null {
	if (data === undefined || data === null) {
		return null;
	}

	if (typeof data === 'string') {
		return data.trim() === '' ? null : data;
	}

	if (typeof data !== 'object') {
		return String(data);
	}

	const record = data as Record<string, unknown>;
	const nested = record.error;

	if (typeof nested === 'string' && nested.trim() !== '') {
		return nested;
	}

	if (nested && typeof nested === 'object') {
		const inner = nested as Record<string, unknown>;
		const message = typeof inner.message === 'string' ? inner.message : undefined;
		const code = typeof inner.code === 'string' ? inner.code : undefined;

		if (message && code) {
			return `${code}: ${message}`;
		}

		if (message) {
			return message;
		}
	}

	if (typeof record.message === 'string' && record.message.trim() !== '') {
		return record.message;
	}

	return JSON.stringify(data);
}

/* ------------------------------------------------------------------ */
/* Multipart                                                           */
/* ------------------------------------------------------------------ */

function escapeHeaderValue(value: string): string {
	return value.replace(/[\r\n]+/g, ' ').replace(/"/g, '%22');
}

/**
 * Build a `multipart/form-data` body by hand.
 *
 * n8n's request helper drops a `FormData` instance before handing the request to
 * its HTTP client, so the payload is assembled here instead. The result has to be
 * sent with the returned content type.
 */
export function buildMultipartBody(parts: MultipartPart[], boundary?: string): MultipartBody {
	const usedBoundary = boundary ?? `----n8nGitverse${randomBytes(16).toString('hex')}`;
	const chunks: Buffer[] = [];

	for (const part of parts) {
		const disposition = [`form-data; name="${escapeHeaderValue(part.name)}"`];

		if (part.fileName !== undefined) {
			disposition.push(`filename="${escapeHeaderValue(part.fileName)}"`);
		}

		const lines = [`--${usedBoundary}`, `Content-Disposition: ${disposition.join('; ')}`];

		if (part.fileName !== undefined) {
			lines.push(`Content-Type: ${part.contentType ?? 'application/octet-stream'}`);
		} else if (part.contentType) {
			lines.push(`Content-Type: ${part.contentType}`);
		}

		chunks.push(Buffer.from(`${lines.join('\r\n')}\r\n\r\n`, 'utf8'));
		chunks.push(Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value, 'utf8'));
		chunks.push(Buffer.from('\r\n', 'utf8'));
	}

	chunks.push(Buffer.from(`--${usedBoundary}--\r\n`, 'utf8'));

	return {
		body: Buffer.concat(chunks),
		contentType: `multipart/form-data; boundary=${usedBoundary}`,
	};
}

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

/**
 * Create a Gitverse client on top of the n8n request helpers.
 *
 * Requests carry the Gitverse accept media type and the bearer token, retry
 * `429` / `5xx` responses with a backoff that honours `Retry-After`, and fail with
 * a {@link GitverseApiError} that carries the parsed payload.
 */
export function createApiClient(
	context: HttpRequestContext,
	options: GitverseApiOptions
): GitverseClient {
	const baseUrl = normalizeBaseUrl(options.baseUrl);
	const retries = options.retries ?? DEFAULT_RETRIES;
	const retryDelay = options.retryDelayMs ?? defaultRetryDelay;
	const timeout = options.timeout ?? 30000;

	async function send<T>(
		method: IHttpRequestMethods,
		url: string,
		body: unknown,
		config: RequestConfig = {}
	): Promise<HttpResponse<T>> {
		const requestOptions: IHttpRequestOptions = {
			url: `${baseUrl}${url}`,
			method,
			headers: {
				Authorization: `Bearer ${options.token}`,
				Accept: GITVERSE_ACCEPT_HEADER,
				...config.headers,
			},
			qs: config.params as IDataObject | undefined,
			body: body as IHttpRequestOptions['body'],
			returnFullResponse: true,
			// The status is inspected here so that retries and errors stay in one place.
			ignoreHttpStatusErrors: true,
			disableFollowRedirect: config.disableFollowRedirect,
			encoding: config.encoding,
			timeout: config.timeout ?? timeout,
		};

		let attempt = 0;

		for (;;) {
			const raw = await context.helpers.httpRequest(requestOptions);
			const status: number = raw?.statusCode ?? 200;
			const headers = normalizeHeaders(raw?.headers);

			if (isRetryableStatus(status) && attempt < retries) {
				attempt += 1;

				await sleep(retryDelay(attempt, parseRetryAfterMs(headers)));

				continue;
			}

			if (status >= 400) {
				throw new GitverseApiError(status, raw?.body, headers);
			}

			return { data: raw?.body as T, status, headers };
		}
	}

	return {
		request: (config) => send(config.method, config.url, config.data, config),
		get: (url, config) => send('GET', url, undefined, config),
		post: (url, body, config) => send('POST', url, body, config),
		put: (url, body, config) => send('PUT', url, body, config),
		patch: (url, body, config) => send('PATCH', url, body, config),
		delete: (url, config) =>
			send('DELETE', url, config?.data, config),
	};
}

/**
 * Build pagination params for the Gitverse API (`page` / `per_page`).
 *
 * A few endpoints (review listings) use `limit` instead of `per_page`, so the
 * names are configurable.
 */
export function buildPaginationParams(
	page: number = 1,
	perPage: number = DEFAULT_PER_PAGE,
	pageParam: string = 'page',
	perPageParam: string = 'per_page'
): Record<string, number> {
	return { [pageParam]: page, [perPageParam]: clampPerPage(perPage) };
}

/**
 * Fetch a list endpoint, following `Link: rel="last"` when `returnAll` is set.
 *
 * `limit` caps the returned items; when `returnAll` is false a single page of at
 * most `limit` (or `perPage`) items is requested.
 */
export async function fetchPages<T>(
	client: GitverseClient,
	url: string,
	options: FetchPagesOptions = {}
): Promise<T[]> {
	const perPage = clampPerPage(options.perPage);
	const params = options.params ?? {};
	const config = options.config ?? {};
	const limit = options.limit ?? 0;
	const pageParam = options.pageParam ?? 'page';
	const perPageParam = options.perPageParam ?? 'per_page';

	if (!options.returnAll) {
		const count = limit > 0 ? Math.min(limit, perPage) : perPage;
		const response = await client.get(url, {
			...config,
			params: { ...params, ...buildPaginationParams(1, count, pageParam, perPageParam) },
		});
		const items = toItemArray<T>(response.data);

		return limit > 0 ? items.slice(0, limit) : items;
	}

	const items: T[] = [];
	let page = 1;
	let lastPage = Infinity;

	do {
		const response = await client.get(url, {
			...config,
			params: { ...params, ...buildPaginationParams(page, perPage, pageParam, perPageParam) },
		});
		const batch = toItemArray<T>(response.data);

		items.push(...batch);

		if (limit > 0 && items.length >= limit) {
			break;
		}

		if (batch.length < perPage) {
			break;
		}

		lastPage = Math.min(lastPage, getLastPage(response.headers?.['link']));
		page += 1;
	} while (page <= lastPage);

	return limit > 0 ? items.slice(0, limit) : items;
}

/**
 * Encode file content for the Gitverse API (base64 for binary, raw for text)
 */
export function encodeContent(content: string, isBinary: boolean = false): string {
	if (isBinary) {
		return Buffer.from(content).toString('base64');
	}

	return content;
}

/**
 * Decode file content from a Gitverse API response
 */
export function decodeContent(content: string, encoding: string = 'utf-8'): string {
	if (encoding === 'base64') {
		return Buffer.from(content, 'base64').toString('utf-8');
	}

	return content;
}
