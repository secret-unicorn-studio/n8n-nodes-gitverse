import {
	IExecuteFunctions,
	NodeOperationError,
} from 'n8n-workflow';
import { AxiosInstance } from 'axios';

/**
 * Parse owner/repo from node parameters
 */
function parseRepository(
	ctx: IExecuteFunctions,
	owner: unknown,
	repo: unknown,
	itemIndex: number
): { owner: string; repo: string } {
	if (!owner || !repo) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Both owner and repo are required. Got: owner=${owner}, repo=${repo}`,
			{ itemIndex }
		);
	}

	return { owner: owner as string, repo: repo as string };
}

/**
 * Read flat owner/repo parameters and validate them
 */
function requireRepository(
	ctx: IExecuteFunctions,
	itemIndex: number
): { owner: string; repo: string } {
	const owner = ctx.getNodeParameter('owner', itemIndex);
	const repo = ctx.getNodeParameter('repo', itemIndex);

	return parseRepository(ctx, owner, repo, itemIndex);
}

/**
 * Read a required string parameter
 */
function requireString(
	ctx: IExecuteFunctions,
	itemIndex: number,
	name: string,
	message: string
): string {
	const value = ctx.getNodeParameter(name, itemIndex);

	if (value === undefined || value === null || value === '') {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	}

	return value as string;
}

/**
 * Get repository details
 */
export async function getRepository(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = requireRepository(this, itemIndex);

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
	const { owner, repo } = requireRepository(this, itemIndex);
	const branch = requireString(
		this,
		itemIndex,
		'branch',
		'Branch name is required'
	);

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
	const { owner, repo } = requireRepository(this, itemIndex);

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
	const { owner, repo } = requireRepository(this, itemIndex);
	const newBranch = requireString(
		this,
		itemIndex,
		'newBranch',
		'New branch name is required'
	);
	const baseBranch =
		(this.getNodeParameter('baseBranch', itemIndex, 'main') as string) || 'main';

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
	const { owner, repo } = requireRepository(this, itemIndex);
	const filePath = requireString(
		this,
		itemIndex,
		'filePath',
		'File path is required'
	);

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
	const { owner, repo } = requireRepository(this, itemIndex);
	const filePath = this.getNodeParameter('filePath', itemIndex, '') as string;
	const content = this.getNodeParameter('content', itemIndex, '') as string;
	const commitMessage =
		(this.getNodeParameter('commitMessage', itemIndex, '') as string) ||
		'Update file via n8n';
	const branch =
		(this.getNodeParameter('branch', itemIndex, '') as string) || 'main';
	const sha = this.getNodeParameter('sha', itemIndex, '') as string;

	if (!filePath || !content) {
		throw new NodeOperationError(
			this.getNode(),
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
	const { owner, repo } = requireRepository(this, itemIndex);
	const prIndex = this.getNodeParameter('prIndex', itemIndex) as number;

	if (prIndex === undefined || prIndex === null) {
		throw new NodeOperationError(
			this.getNode(),
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
	const { owner, repo } = requireRepository(this, itemIndex);

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
	const { owner, repo } = requireRepository(this, itemIndex);
	const head = this.getNodeParameter('head', itemIndex, '') as string;
	const base = (this.getNodeParameter('base', itemIndex, '') as string) || 'main';
	const title = this.getNodeParameter('title', itemIndex, '') as string;
	const body = this.getNodeParameter('body', itemIndex, '') as string;
	const maintainerCanModify =
		this.getNodeParameter('maintainerCanModify', itemIndex, true) !== false;

	if (!head || !base || !title) {
		throw new NodeOperationError(
			this.getNode(),
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
	const { owner, repo } = requireRepository(this, itemIndex);
	const baseBranch = this.getNodeParameter('baseBranch', itemIndex, '') as string;
	const headBranch = this.getNodeParameter('headBranch', itemIndex, '') as string;

	if (!baseBranch || !headBranch) {
		throw new NodeOperationError(
			this.getNode(),
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
	const { owner, repo } = requireRepository(this, itemIndex);

	const response = await api.get(`/api/v1/repos/${owner}/${repo}/commits`, {
		params: { page: 1, perPage: 50 },
	});
	return response.data;
}
