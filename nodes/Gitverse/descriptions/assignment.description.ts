import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const resource = 'assignment';

export const assignmentOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a Smartclass assignment by its ID',
		action: 'Get an assignment',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const assignmentFields: INodeProperties[] = [
	{
		displayName: 'Assignment ID',
		name: 'assignmentId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the assignment',
		displayOptions: { show: { resource: [resource] } },
	},
];
