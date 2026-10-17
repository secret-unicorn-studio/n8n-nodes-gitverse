import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
} from '../utils/params';

export async function getRepository(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(`/repos/${owner}/${repo}`);

	return response.data;
}

export async function getManyRepositories(
	this: IExecuteFunctions,
	api: AxiosInstance,
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
	api: AxiosInstance,
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
	api: AxiosInstance,
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
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.delete(`/repos/${owner}/${repo}`);

	return response.data ?? { success: true };
}

export async function getCollaborators(
	this: IExecuteFunctions,
	api: AxiosInstance,
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
	api: AxiosInstance,
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
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(`/repos/${owner}/${repo}/languages`);

	return response.data;
}

export async function forkRepository(
	this: IExecuteFunctions,
	api: AxiosInstance,
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
