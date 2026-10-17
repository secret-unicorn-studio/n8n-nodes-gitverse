import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { getRepositoryRef, getRequiredNumber } from '../../Gitverse/utils/params';

function jobsPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/actions/jobs`;
}

export async function getJob(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const jobId = getRequiredNumber(this, itemIndex, 'jobId', 'Job ID is required');

	const response = await api.get(`${jobsPath(owner, repo)}/${jobId}`);

	return response.data;
}

export async function getJobLogs(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const jobId = getRequiredNumber(this, itemIndex, 'jobId', 'Job ID is required');

	const response = await api.get(`${jobsPath(owner, repo)}/${jobId}/logs`);

	// The endpoint answers with plain text rather than JSON.
	return typeof response.data === 'string' ? { logs: response.data } : response.data;
}

export async function rerunJob(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const jobId = getRequiredNumber(this, itemIndex, 'jobId', 'Job ID is required');

	const response = await api.post(`${jobsPath(owner, repo)}/${jobId}/rerun`);

	return response.data ?? { success: true };
}
