import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getPaginationOptions,
	getRepositoryRef,
	getRequiredLocator,
	getRequiredString,
} from '../utils/params';

export async function getBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const branch = getRequiredLocator(
		this,
		itemIndex,
		'branch',
		'Branch name is required'
	);

	const response = await api.get(`/repos/${owner}/${repo}/branches/${branch}`);

	return response.data;
}

export async function getManyBranches(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`/repos/${owner}/${repo}/branches`,
		pagination
	);
}

export async function createBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const newBranch = getRequiredString(
		this,
		itemIndex,
		'newBranch',
		'New branch name is required'
	);
	const baseBranch =
		(this.getNodeParameter('baseBranch', itemIndex, 'main') as string) || 'main';

	const baseBranchResponse = await api.get(
		`/repos/${owner}/${repo}/branches/${baseBranch}`
	);
	const baseSha = baseBranchResponse.data.commit.sha;

	const response = await api.post(`/repos/${owner}/${repo}/git/refs`, {
		ref: `refs/heads/${newBranch}`,
		sha: baseSha,
	});

	return response.data;
}

export async function deleteBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const branch = getRequiredLocator(
		this,
		itemIndex,
		'branch',
		'Branch name is required'
	);

	const response = await api.delete(
		`/repos/${owner}/${repo}/git/refs/heads/${branch}`
	);

	return response.data ?? { success: true };
}
