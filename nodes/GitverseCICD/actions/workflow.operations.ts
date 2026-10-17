import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
} from '../../Gitverse/utils/params';

function workflowsPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/actions/workflows`;
}

export async function getWorkflowDispatchParameters(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const workflow = getRequiredString(this, itemIndex, 'workflow', 'Workflow file is required');
	const params: Record<string, unknown> = {};
	const branch = getOptionalString(this, itemIndex, 'branch');

	if (branch) params.branch = branch;

	const response = await api.get(
		`${workflowsPath(owner, repo)}/${encodeURIComponent(workflow)}/dispatches`,
		{ params }
	);

	return response.data;
}

export async function dispatchWorkflow(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const workflow = getRequiredString(this, itemIndex, 'workflow', 'Workflow file is required');
	const params: Record<string, unknown> = {};
	const branch = getOptionalString(this, itemIndex, 'branch');

	if (branch) params.branch = branch;

	const inputs = this.getNodeParameter('inputs', itemIndex, {}) as Record<string, unknown>;

	const response = await api.post(
		`${workflowsPath(owner, repo)}/${encodeURIComponent(workflow)}/dispatches`,
		inputs,
		{ params }
	);

	return response.data ?? { success: true };
}

export async function getWorkflows(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, workflowsPath(owner, repo), pagination);
}

export async function getWorkflow(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const workflowId = getRequiredString(this, itemIndex, 'workflowId', 'Workflow ID is required');

	const response = await api.get(
		`${workflowsPath(owner, repo)}/${encodeURIComponent(workflowId)}`
	);

	return response.data;
}

export async function getWorkflowRuns(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const workflowId = getRequiredString(this, itemIndex, 'workflowId', 'Workflow ID is required');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${workflowsPath(owner, repo)}/${encodeURIComponent(workflowId)}/runs`,
		pagination
	);
}
