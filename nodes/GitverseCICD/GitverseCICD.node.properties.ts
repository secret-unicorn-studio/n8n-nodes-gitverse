import { INodeProperties } from 'n8n-workflow';

import { cicdFields, cicdOperations, cicdResources } from './descriptions/cicd.description';

export const gitverseCicdNodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: cicdResources,
		default: 'workflow',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: cicdOperations,
		default: 'getAll',
	},
	...cicdFields,
];
