import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient, isGitverseError } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import { getOptionalString, getPaginationOptions, getRepositoryRef } from '../utils/params';

export async function getManyStars(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const pagination = getPaginationOptions(this, itemIndex, 50);
	const params: Record<string, unknown> = {};
	const sort = getOptionalString(this, itemIndex, 'sort');

	if (sort) params.sort = sort;

	return fetchPages<Record<string, any>>(api, '/user/starred', { ...pagination, params });
}

export async function checkStar(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	try {
		const response = await api.get(`/user/starred/${owner}/${repo}`);

		return response.data ?? { starred: true };
	} catch (error) {
		// The API answers 404 when the repository is not starred.
		if (isGitverseError(error, 404)) {
			return { starred: false };
		}

		throw error;
	}
}

export async function addStar(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.put(`/user/starred/${owner}/${repo}`);

	return response.data ?? { success: true };
}

export async function removeStar(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.delete(`/user/starred/${owner}/${repo}`);

	return response.data ?? { success: true };
}
