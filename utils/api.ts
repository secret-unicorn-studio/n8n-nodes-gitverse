import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
} from 'axios';

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
	config?: AxiosRequestConfig;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
	__gitverseAttempt?: number;
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

function isRetryableStatus(status?: number): boolean {
	return status !== undefined && RETRYABLE_STATUSES.includes(status);
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

/**
 * Create a configured Axios instance for the Gitverse API.
 */
export function createApiClient(options: GitverseApiOptions): AxiosInstance {
	const retries = options.retries ?? DEFAULT_RETRIES;
	const retryDelay = options.retryDelayMs ?? defaultRetryDelay;

	const client = axios.create({
		baseURL: normalizeBaseUrl(options.baseUrl),
		headers: {
			Authorization: `Bearer ${options.token}`,
			Accept: GITVERSE_ACCEPT_HEADER,
		},
		timeout: options.timeout ?? 30000,
	});

	client.interceptors.response.use(
		(response: AxiosResponse) => response,
		async (error) => {
			const config = error.config as RetryableRequestConfig | undefined;
			const attempt = config?.__gitverseAttempt ?? 0;

			if (
				config &&
				retries > 0 &&
				isRetryableStatus(error.response?.status) &&
				attempt < retries
			) {
				const nextAttempt = attempt + 1;
				const waitFor = retryDelay(
					nextAttempt,
					parseRetryAfterMs(error.response?.headers)
				);

				await sleep(waitFor);

				config.__gitverseAttempt = nextAttempt;

				return client.request(config);
			}

			if (error.response?.data) {
				const message = extractErrorMessage(error.response.data);

				if (message !== null) {
					error.message = `[Gitverse ${error.response.status}] ${message}`;
				}
			}

			return Promise.reject(error);
		}
	);

	return client;
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
	client: AxiosInstance,
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
		const response: AxiosResponse = await client.get(url, {
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
		const response: AxiosResponse = await client.get(url, {
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

		lastPage = Math.min(
			lastPage,
			getLastPage(response.headers?.['link'] as string | undefined)
		);

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
