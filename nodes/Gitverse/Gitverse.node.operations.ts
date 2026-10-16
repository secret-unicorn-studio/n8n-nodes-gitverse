import {
	IExecuteFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { AxiosInstance } from 'axios';

interface OperationParams {
	owner?: string;
	repo?: string;
	repository?: string;
	branch?: string;
	newBranch?: string;
	baseBranch?: string;
	filePath?: string;
	content?: string;
	commitMessage?: string;
	sha?: string;
	prIndex?: number;
	head?: string;
	base?: string;
	title?: string;
	body?: string;
	maintainerCanModify?: boolean;
	headBranch?: string;
}

/**
 * Parse owner/repo from parameters
 */
function parseRepository(
	params: OperationParams,
	itemIndex: number
): { owner: string; repo: string } {
	const owner = params.owner;
	const repo = params.repo;

	if (!owner || !repo) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			`Both owner and repo are required. Got: owner=${owner}, repo=${repo}`,
			{ itemIndex }
		);
	}

	return { owner, repo };
}

/**
 * Get repository details
 */
export async function getRepository(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);

	const response = await api.get(`/api/v1/repos/${owner}/${repo}`);
	return response.data;
}

/**
 * Get many repositories (list)
 */
export async function getManyRepositories(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const filters = this.getNodeParameter('filters', itemIndex, {}) as Record<
		string,
		any
	>;

	const response = await api.get('/api/v1/user/repos', {
		params: {
			type: filters.type || 'all',
			sort: filters.sort || 'asc',
			page: 1,
			perPage: filters.perPage || 50,
		},
	});
	return response.data;
}

/**
 * Get branch details
 */
export async function getBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const branch = params.branch;

	if (!branch) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'Branch name is required',
			{ itemIndex }
		);
	}

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/branches/${branch}`);
	return response.data;
}

/**
 * Get many branches (list)
 */
export async function getManyBranches(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/branches`, {
		params: { page: 1, perPage: 50 },
	});
	return response.data;
}

/**
 * Create a new branch
 */
export async function createBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const newBranch = params.newBranch;
	const baseBranch = params.baseBranch || 'main';

	if (!newBranch) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'New branch name is required',
			{ itemIndex }
		);
	}

	// First, get the base branch to find its commit SHA
	const baseBranchResponse = await api.get(
		`/api/v1/repos/${owner}/${repo}/branches/${baseBranch}`
	);
	const baseSha = baseBranchResponse.data.commit.sha;

	// Create the new branch reference
	const response = await api.post(`/api/v1/repos/${owner}/${repo}/git/refs`, {
		ref: `refs/heads/${newBranch}`,
		sha: baseSha,
	});

	return response.data;
}

/**
 * Get file content
 */
export async function getFile(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const filePath = params.filePath;

	if (!filePath) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'File path is required',
			{ itemIndex }
		);
	}

	const response = await api.get(
		`/api/v1/repos/${owner}/${repo}/contents/${filePath}`
	);
	return response.data;
}

/**
 * Create or update a file
 */
export async function createOrUpdateFile(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const filePath = params.filePath;
	const content = params.content;
	const commitMessage = params.commitMessage || 'Update file via n8n';
	const branch = params.branch || 'main';
	const sha = params.sha;

	if (!filePath || !content) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'File path and content are required',
			{ itemIndex }
		);
	}

	const body: Record<string, string> = {
		message: commitMessage,
		content: Buffer.from(content).toString('base64'),
		branch,
	};

	if (sha) {
		body.sha = sha;
	}

	const response = await api.put(
		`/api/v1/repos/${owner}/${repo}/contents/${filePath}`,
		body
	);

	return response.data;
}

/**
 * Get pull request details
 */
export async function getPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const prIndex = params.prIndex;

	if (prIndex === undefined || prIndex === null) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'Pull request index is required',
			{ itemIndex }
		);
	}

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/pulls/${prIndex}`);
	return response.data;
}

/**
 * Get many pull requests (list)
 */
export async function getManyPullRequests(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/pulls`, {
		params: { page: 1, perPage: 50 },
	});
	return response.data;
}

/**
 * Create a pull request
 */
export async function createPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const head = params.head;
	const base = params.base || 'main';
	const title = params.title;
	const body = params.body;
	const maintainerCanModify = params.maintainerCanModify !== false;

	if (!head || !base || !title) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'Head, base, and title are required',
			{ itemIndex }
		);
	}

	const response = await api.post(`/api/v1/repos/${owner}/${repo}/pulls`, {
		title,
		body,
		head,
		base,
		maintainerCanModify,
	});

	return response.data;
}

/**
 * Compare two branches
 */
export async function compareBranches(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);
	const baseBranch = params.baseBranch;
	const headBranch = params.headBranch;

	if (!baseBranch || !headBranch) {
		throw new NodeOperationError(
			{ getNode: () => ({ name: '' }) } as any,
			'Base and head branches are required',
			{ itemIndex }
		);
	}

	const response = await api.get(
		`/api/v1/repos/${owner}/${repo}/compare/${baseBranch}...${headBranch}`
	);
	return response.data;
}

/**
 * Get many commits (list)
 */
export async function getManyCommits(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const params = this.getNodeParameter('json', itemIndex, {}) as OperationParams;
	const { owner, repo } = parseRepository(params, itemIndex);

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/commits`, {
		params: { page: 1, perPage: 50 },
	});
	return response.data;
}
