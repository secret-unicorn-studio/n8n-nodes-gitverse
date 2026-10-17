import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	encodePath,
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
	getStringList,
} from '../utils/params';

export async function getRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(`/repos/${owner}/${repo}`);

	return response.data;
}

export async function getManyRepositories(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const organization = getOptionalString(this, itemIndex, 'organization');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		organization ? `/orgs/${organization}/repos` : '/user/repos',
		pagination
	);
}

export async function createRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(
		this,
		itemIndex,
		'name',
		'Repository name is required'
	);
	const organization = getOptionalString(this, itemIndex, 'organization');

	const response = await api.post(
		organization ? `/orgs/${organization}/repos` : '/user/repos',
		{
			name,
			description: getOptionalString(this, itemIndex, 'description'),
			private: this.getNodeParameter('private', itemIndex, false),
			auto_init: this.getNodeParameter('autoInit', itemIndex, false),
		}
	);

	return response.data;
}

export async function updateRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	if ('description' in fields) body.description = fields.description;
	if ('website' in fields) body.website = fields.website;
	if ('private' in fields) body.private = fields.private;
	if ('archived' in fields) body.archived = fields.archived;
	if ('defaultBranch' in fields) body.default_branch = fields.defaultBranch;
	if ('hasIssues' in fields) body.has_issues = fields.hasIssues;
	if ('hasWiki' in fields) body.has_wiki = fields.hasWiki;
	if ('hasPullRequests' in fields) body.has_pull_requests = fields.hasPullRequests;

	const response = await api.patch(`/repos/${owner}/${repo}`, body);

	return response.data;
}

export async function deleteRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.delete(`/repos/${owner}/${repo}`);

	return response.data ?? { success: true };
}

export async function getCollaborators(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`/repos/${owner}/${repo}/collaborators`,
		pagination
	);
}

export async function addCollaborator(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const username = getRequiredString(
		this,
		itemIndex,
		'username',
		'Username is required'
	);

	const response = await api.put(
		`/repos/${owner}/${repo}/collaborators/${username}`,
		{
			permission: getOptionalString(this, itemIndex, 'permission', 'write'),
		}
	);

	return response.data ?? { success: true };
}

export async function getLanguages(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(`/repos/${owner}/${repo}/languages`);

	return response.data;
}

export async function forkRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const organization = getOptionalString(this, itemIndex, 'organization');

	const response = await api.post(
		`/repos/${owner}/${repo}/forks`,
		organization ? { organization } : {}
	);

	return response.data;
}

/* ------------------------------------------------------------------ */
/* Git database: trees, commits and refs                               */
/* ------------------------------------------------------------------ */

export async function getTree(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const treeSha = getRequiredString(this, itemIndex, 'treeSha', 'Tree SHA is required');
	const params: Record<string, unknown> = {};

	if (this.getNodeParameter('recursive', itemIndex, false) === true) {
		params.recursive = true;
	}

	const response = await api.get(`/repos/${owner}/${repo}/git/trees/${encodePath(treeSha)}`, {
		params,
	});

	return response.data;
}

export async function getRef(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const ref = getRequiredString(this, itemIndex, 'refName', 'Ref is required');

	const response = await api.get(`/repos/${owner}/${repo}/git/ref/${encodePath(ref)}`);

	return response.data;
}

export async function getMatchingRefs(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const ref = getRequiredString(this, itemIndex, 'refName', 'Ref is required');

	const response = await api.get(`/repos/${owner}/${repo}/git/matching-refs/${encodePath(ref)}`);

	return response.data;
}

export async function createRef(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body = {
		ref: getRequiredString(this, itemIndex, 'refName', 'Ref is required'),
		sha: getRequiredString(this, itemIndex, 'refSha', 'SHA is required'),
	};

	const response = await api.post(`/repos/${owner}/${repo}/git/refs`, body);

	return response.data;
}

export async function deleteRef(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const ref = getRequiredString(this, itemIndex, 'refName', 'Ref is required');

	const response = await api.delete(`/repos/${owner}/${repo}/git/refs/${encodePath(ref)}`);

	return response.data ?? { success: true };
}

/**
 * Read the entries of the `tree` collection into the shape the API expects.
 */
function readTreeEntries(ctx: IExecuteFunctions, itemIndex: number): Record<string, unknown>[] {
	const value = ctx.getNodeParameter('treeEntries', itemIndex, {}) as { values?: any[] };
	const values = Array.isArray(value?.values) ? value.values : [];

	return values.map((entry) => ({
		path: entry.path,
		mode: entry.mode,
		type: entry.type,
		sha: entry.sha,
	}));
}

export async function createTree(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = { tree: readTreeEntries(this, itemIndex) };
	const baseTree = getOptionalString(this, itemIndex, 'baseTree');

	if (baseTree) body.base_tree = baseTree;

	const response = await api.post(`/repos/${owner}/${repo}/git/trees`, body);

	return response.data;
}

export async function createCommit(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		message: getRequiredString(this, itemIndex, 'commitMessage', 'Commit message is required'),
		tree: getRequiredString(this, itemIndex, 'treeSha', 'Tree SHA is required'),
	};

	const parents = getStringList(this, itemIndex, 'parents');

	if (parents) body.parents = parents;

	const author = this.getNodeParameter('author', itemIndex, {}) as Record<string, unknown>;

	if (Object.keys(author).length > 0) body.author = author;

	const committer = this.getNodeParameter('committer', itemIndex, {}) as Record<string, unknown>;

	if (Object.keys(committer).length > 0) body.committer = committer;

	const response = await api.post(`/repos/${owner}/${repo}/git/commits`, body);

	return response.data;
}

/* ------------------------------------------------------------------ */
/* Collaborator permissions and migration                              */
/* ------------------------------------------------------------------ */

export async function setCollaboratorPermission(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const username = getRequiredString(
		this,
		itemIndex,
		'collaboratorUsername',
		'Username is required'
	);
	const permission = getOptionalString(this, itemIndex, 'permission');

	const response = await api.put(
		`/repos/${owner}/${repo}/collaborators/${encodeURIComponent(username)}`,
		{ permission }
	);

	return response.data ?? { success: true };
}

export async function migrateRepository(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const body: Record<string, unknown> = {
		source_url: getRequiredString(this, itemIndex, 'sourceUrl', 'Source URL is required'),
	};

	const optional: Array<[string, string]> = [
		['name', 'migrationName'],
		['owner', 'migrationOwner'],
		['source_type', 'sourceType'],
		['source_username', 'sourceUsername'],
		['source_password', 'sourcePassword'],
		['source_token', 'sourceToken'],
		['description', 'migrationDescription'],
		['lfs_endpoint', 'lfsEndpoint'],
	];

	for (const [field, parameter] of optional) {
		const value = getOptionalString(this, itemIndex, parameter);

		if (value) body[field] = value;
	}

	const flags: Array<[string, string]> = [
		['private', 'private'],
		['use_lfs', 'useLfs'],
		['pull_requests', 'pullRequests'],
		['releases', 'releases'],
	];

	for (const [field, parameter] of flags) {
		if (this.getNodeParameter(parameter, itemIndex, false) === true) {
			body[field] = true;
		}
	}

	const response = await api.post('/repos/migrate', body);

	return response.data;
}

export async function getMigrationStatus(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(`/repos/${owner}/${repo}/migration/status`);

	return response.data;
}
