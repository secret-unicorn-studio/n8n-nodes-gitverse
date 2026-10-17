import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
} from '../utils/params';

export async function getPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = this.getNodeParameter('pullRequestNumber', itemIndex) as number;

	if (number === undefined || number === null) {
		throw new NodeOperationError(this.getNode(), 'Pull request number is required', {
			itemIndex,
		});
	}

	const response = await api.get(`/repos/${owner}/${repo}/pulls/${number}`);

	return response.data;
}

export async function getManyPullRequests(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);
	const state = getOptionalString(this, itemIndex, 'state', 'open');

	return fetchPages<Record<string, any>>(
		api,
		`/repos/${owner}/${repo}/pulls`,
		{ ...pagination, params: { state } }
	);
}

export async function createPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.post(`/repos/${owner}/${repo}/pulls`, {
		title: getRequiredString(this, itemIndex, 'title', 'Title is required'),
		head: getRequiredString(this, itemIndex, 'head', 'Head branch is required'),
		base: getRequiredString(this, itemIndex, 'base', 'Base branch is required'),
		body: getOptionalString(this, itemIndex, 'body'),
	});

	return response.data;
}
