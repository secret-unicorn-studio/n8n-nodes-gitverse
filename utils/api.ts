import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface GitverseCredentials {
	baseUrl: string;
	token: string;
}

export interface GitverseApiOptions {
	baseUrl: string;
	token: string;
}

export interface GitversePaginatedResponse<T> {
	items: T[];
	totalCount: number;
	page: number;
	perPage: number;
	hasMore: boolean;
}

export interface GitverseError {
	message: string;
	link: string;
}

/**
 * Create a configured Axios instance for Gitverse API
 */
export function createApiClient(options: GitverseApiOptions): AxiosInstance {
	const client = axios.create({
		baseURL: options.baseUrl.replace(/\/+$/, ''),
		headers: {
			Authorization: `token ${options.token}`,
			Accept: 'application/json',
		},
		timeout: 30000,
	});

	/**
	 * Response interceptor: unwrap Gitea error responses
	 */
	client.interceptors.response.use(
		(response: AxiosResponse) => response,
		(error) => {
			if (error.response?.data) {
				const data = error.response.data;
				const message =
					typeof data === 'string'
						? data
						: data.message || data.error || JSON.stringify(data);
				error.message = `[Gitverse ${error.response.status}] ${message}`;
			}
			return Promise.reject(error);
		}
	);

	return client;
}

/**
 * Build pagination params for Gitea API
 */
export function buildPaginationParams(
	page: number = 1,
	perPage: number = 50
): Record<string, number> {
	return { page, perPage };
}

/**
 * Fetch all pages for paginated endpoints
 */
export async function fetchAllPages<T>(
	client: AxiosInstance,
	url: string,
	config?: AxiosRequestConfig
): Promise<GitversePaginatedResponse<T>> {
	const allItems: T[] = [];
	let page = 1;
	let hasMore = true;

	while (hasMore) {
		const response: AxiosResponse<T[]> = await client.get(url, {
			params: { page, perPage: 50 },
			...config,
		});

		const items = response.data || [];
		allItems.push(...items);

		const totalCount = parseInt(
			response.headers['x-total-count'] || String(items.length),
			10
		);
		hasMore = items.length === 50 && allItems.length < totalCount;
		page++;
	}

	return {
		items: allItems,
		totalCount: allItems.length,
		page: 1,
		perPage: 50,
		hasMore: false,
	};
}

/**
 * Encode file content for Gitea API (base64 for binary, raw for text)
 */
export function encodeContent(
	content: string,
	isBinary: boolean = false
): string {
	if (isBinary) {
		return Buffer.from(content).toString('base64');
	}
	return content;
}

/**
 * Decode file content from Gitea API response
 */
export function decodeContent(content: string, encoding: string = 'utf-8'): string {
	if (encoding === 'base64') {
		return Buffer.from(content, 'base64').toString('utf-8');
	}
	return content;
}
