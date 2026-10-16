import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { gitverseNodeProperties } from './Gitverse.node.properties';
import { execute as executeOperations } from './Gitverse.node.execute';

export class Gitverse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gitverse',
		name: 'gitverse',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:gitverse.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Gitverse (Gitea) API',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData = await executeOperations.call(this);

		return [returnData];
	}
}
