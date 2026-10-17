import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
} from '../../Gitverse/utils/params';

function runsPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/actions/runs`;
}

export async function getRuns(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, runsPath(owner, repo), pagination);
}

export async function getRun(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runId = getRequiredNumber(this, itemIndex, 'runId', 'Run ID is required');

	const response = await api.get(`${runsPath(owner, repo)}/${runId}`);

	return response.data;
}

export async function getRunJobs(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runId = getRequiredNumber(this, itemIndex, 'runId', 'Run ID is required');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${runsPath(owner, repo)}/${runId}/jobs`,
		pagination
	);
}

export async function getRunByIndex(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runIndex = getRequiredNumber(this, itemIndex, 'runIndex', 'Run index is required');

	const response = await api.get(`${runsPath(owner, repo)}/index/${runIndex}`);

	return response.data;
}

export async function getRunJobsByIndex(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runIndex = getRequiredNumber(this, itemIndex, 'runIndex', 'Run index is required');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${runsPath(owner, repo)}/index/${runIndex}/jobs`,
		pagination
	);
}

export async function cancelRun(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runId = getRequiredNumber(this, itemIndex, 'runId', 'Run ID is required');

	const response = await api.post(`${runsPath(owner, repo)}/${runId}/cancel`);

	return response.data ?? { success: true };
}

export async function rerunRun(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const runId = getRequiredNumber(this, itemIndex, 'runId', 'Run ID is required');

	const response = await api.post(`${runsPath(owner, repo)}/${runId}/rerun`);

	return response.data ?? { success: true };
}
