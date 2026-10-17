import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { gitverseCicdNodeProperties } from './GitverseCICD.node.properties';
import { execute as executeOperations } from './GitverseCICD.node.execute';
import { listSearch } from '../Gitverse/methods/loadOptions';

export class GitverseCICD implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gitverse CI/CD',
		name: 'gitverseCicd',
		icon: 'file:gitverse.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Manage the CI/CD side of Gitverse: workflows, runs, jobs, runners, variables, secrets and artifacts',
		defaults: {
			name: 'Gitverse CI/CD',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'gitverseApi',
				required: true,
			},
		],
		properties: gitverseCicdNodeProperties,
	};

	methods = {
		listSearch,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = await executeOperations.call(this);

		return [returnData];
	}
}
