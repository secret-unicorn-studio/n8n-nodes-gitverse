import {
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { createApiClient, GitverseApiOptions } from '../../utils/api';
import { toJsonRecord } from '../Gitverse/utils/params';
import * as artifact from './actions/artifact.operations';
import * as job from './actions/job.operations';
import * as run from './actions/run.operations';
import * as runner from './actions/runner.operations';
import * as secret from './actions/secret.operations';
import * as variable from './actions/variable.operations';
import * as workflow from './actions/workflow.operations';

export type OperationFunction = (
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
) => Promise<unknown>;

type ResourceOperations = Record<string, OperationFunction>;

export const operations: Record<string, ResourceOperations> = {
	workflow: {
		getAll: workflow.getWorkflows,
		get: workflow.getWorkflow,
		getRuns: workflow.getWorkflowRuns,
		getDispatches: workflow.getWorkflowDispatchParameters,
		dispatch: workflow.dispatchWorkflow,
	},
	run: {
		getAll: run.getRuns,
		get: run.getRun,
		getJobs: run.getRunJobs,
		getByIndex: run.getRunByIndex,
		getJobsByIndex: run.getRunJobsByIndex,
		cancel: run.cancelRun,
		rerun: run.rerunRun,
	},
	job: {
		get: job.getJob,
		getLogs: job.getJobLogs,
		rerun: job.rerunJob,
	},
	variable: {
		getAll: variable.getVariables,
		get: variable.getVariable,
		create: variable.createVariable,
		update: variable.updateVariable,
		delete: variable.deleteVariable,
	},
	secret: {
		getAll: secret.getSecrets,
		get: secret.getSecret,
		upsert: secret.upsertSecret,
		delete: secret.deleteSecret,
	},
	runner: {
		getAll: runner.getRunners,
		get: runner.getRunner,
		createRegistrationToken: runner.createRunnerRegistrationToken,
		delete: runner.deleteRunner,
	},
	artifact: {
		getAll: artifact.getArtifacts,
		get: artifact.getArtifact,
		delete: artifact.deleteArtifact,
		download: artifact.getArtifactDownloadUrl,
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
