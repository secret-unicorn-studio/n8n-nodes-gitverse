import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { createApiClient, GitverseApiOptions } from '../../utils/api';
import * as branch from './actions/branch.operations';
import * as commit from './actions/commit.operations';
import * as file from './actions/file.operations';
import * as pullRequest from './actions/pullRequest.operations';
import * as repository from './actions/repository.operations';
import { toJsonRecord } from './utils/params';

export type OperationFunction = (
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
) => Promise<unknown>;

type ResourceOperations = Record<string, OperationFunction>;

export const operations: Record<string, ResourceOperations> = {
	branch: {
		get: branch.getBranch,
		getAll: branch.getManyBranches,
		create: branch.createBranch,
		delete: branch.deleteBranch,
	},
	commit: {
		get: commit.getCommit,
		getAll: commit.getManyCommits,
		compare: commit.compareCommits,
	},
	file: {
		get: file.getFile,
		createOrUpdate: file.createOrUpdateFile,
		delete: file.deleteFile,
	},
	pullRequest: {
		get: pullRequest.getPullRequest,
		getAll: pullRequest.getManyPullRequests,
		create: pullRequest.createPullRequest,
		update: pullRequest.updatePullRequest,
		updateBranch: pullRequest.updatePullRequestBranch,
		getMergeStatus: pullRequest.getPullRequestMergeStatus,
		getFiles: pullRequest.getPullRequestFiles,
		getCommits: pullRequest.getPullRequestCommits,
		createComment: pullRequest.createPullRequestComment,
		getReviews: pullRequest.getPullRequestReviews,
		createReview: pullRequest.createPullRequestReview,
		submitReview: pullRequest.submitPullRequestReview,
		deleteReview: pullRequest.deletePullRequestReview,
	},
	repository: {
		get: repository.getRepository,
		getAll: repository.getManyRepositories,
		create: repository.createRepository,
		update: repository.updateRepository,
		delete: repository.deleteRepository,
		getCollaborators: repository.getCollaborators,
		addCollaborator: repository.addCollaborator,
		getLanguages: repository.getLanguages,
		fork: repository.forkRepository,
	},
};

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter('resource', 0) as string;
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials<GitverseApiOptions>('gitverseApi');

	const api = createApiClient({
		baseUrl: credentials.baseUrl,
		token: credentials.token,
		retries: credentials.retries,
	});

	const resourceOps = operations[resource];

	if (!resourceOps) {
		throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
	}

	const operationFn = resourceOps[operation];

	if (!operationFn) {
		throw new NodeOperationError(
			this.getNode(),
			`Unknown operation: ${operation} for resource ${resource}`
		);
	}

	for (let i = 0; i < items.length; i++) {
		try {
			const result = await operationFn.call(this, api, i);
			const entries = Array.isArray(result) ? result : [result];

			for (const entry of entries) {
				returnData.push({
					json: toJsonRecord(entry),
					pairedItem: { item: i },
				});
			}
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: (error as Error).message },
					pairedItem: { item: i },
				});
				continue;
			}

			throw error;
		}
	}

	return returnData;
}
