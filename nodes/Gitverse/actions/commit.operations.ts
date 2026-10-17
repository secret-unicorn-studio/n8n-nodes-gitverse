import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
} from '../utils/params';

export async function getCommit(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const sha = getRequiredString(this, itemIndex, 'sha', 'Commit SHA is required');

	const response = await api.get(
		`/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`
	);

	return response.data;
}

export async function getManyCommits(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);
	const sha = getOptionalString(this, itemIndex, 'sha');
	const path = getOptionalString(this, itemIndex, 'path');

	const params: Record<string, unknown> = {};

	if (sha) {
		params.sha = sha;
	}

	if (path) {
		params.path = path;
	}

	return fetchPages<Record<string, any>>(
		api,
		`/repos/${owner}/${repo}/commits`,
		{ ...pagination, params }
	);
}

export async function compareCommits(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const base = getRequiredString(this, itemIndex, 'base', 'Base reference is required');
	const head = getRequiredString(this, itemIndex, 'head', 'Head reference is required');

	const response = await api.get(
		`/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`
	);

	return response.data;
}
