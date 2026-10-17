import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { gitverseNodeProperties } from './Gitverse.node.properties';
import { execute as executeOperations } from './Gitverse.node.execute';
import { listSearch } from './methods/loadOptions';

export class Gitverse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gitverse',
		name: 'gitverse',
		icon: 'file:gitverse.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Gitverse API',
		defaults: {
			name: 'Gitverse',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'gitverseApi',
				required: true,
			},
		],
		properties: gitverseNodeProperties,
	};

	methods = {
		listSearch,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = await executeOperations.call(this);

		return [returnData];
	}
}
