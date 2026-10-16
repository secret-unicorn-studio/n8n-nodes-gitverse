import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { AxiosInstance } from 'axios';
import { createApiClient, GitverseApiOptions } from '../../utils/api';
import {
	getRepository,
	getManyRepositories,
	getBranch,
	getManyBranches,
	createBranch,
	getFile,
	createOrUpdateFile,
	getPullRequest,
	getManyPullRequests,
	createPullRequest,
	compareBranches,
	getManyCommits,
} from './Gitverse.node.operations';

interface OperationsMap {
	[key: string]: {
		[key: string]: (this: IExecuteFunctions, api: AxiosInstance, itemIndex: number) => Promise<any>;
	};
}

const operations: OperationsMap = {
	repository: {
		get: getRepository,
		getAll: getManyRepositories,
	},
	branch: {
		get: getBranch,
		getAll: getManyBranches,
		create: createBranch,
	},
	file: {
		get: getFile,
		createOrUpdate: createOrUpdateFile,
	},
	pullRequest: {
		get: getPullRequest,
		getAll: getManyPullRequests,
		create: createPullRequest,
		compare: compareBranches,
	},
	commit: {
		getAll: getManyCommits,
	},
};

export async function execute(this: IExecuteFunctions) {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const resource = this.getNodeParameter('resource', 0) as string;
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials<GitverseApiOptions>('gitverseApi');

	const baseUrl = credentials.baseUrl;
	const token = credentials.token;
	const api = createApiClient({ baseUrl, token });

	for (let i = 0; i < items.length; i++) {
		try {
			const resourceOps = operations[resource];

			if (!resourceOps) {
				throw new NodeOperationError(
					this.getNode(),
					`Unknown resource: ${resource}`,
					{ itemIndex: i }
				);
			}

			const opFn = resourceOps[operation];

			if (!opFn) {
				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation: ${operation} for resource ${resource}`,
					{ itemIndex: i }
				);
			}

			const result = await opFn.call(this, api, i);
			returnData.push({ json: result });
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
