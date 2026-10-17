import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'star';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const starOperations: INodePropertyOptions[] = [
	{
		name: 'Add Star',
		value: 'add',
		description: 'Star a repository',
		action: 'Star a repository',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Check Star',
		value: 'check',
		description: 'Check whether a repository is starred',
		action: 'Check a star',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the starred repositories of the authenticated user',
		action: 'Get many stars',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Remove Star',
		value: 'remove',
		description: 'Remove the star from a repository',
		action: 'Remove a star',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const starFields: INodeProperties[] = [
	repositoryProperty(scope(['check', 'add', 'remove'])),
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		options: [
			{ name: 'Created', value: 'created' },
			{ name: 'Full Name', value: 'full_name' },
			{ name: 'Pushed', value: 'pushed' },
			{ name: 'Updated', value: 'updated' },
		],
		default: 'created',
		description: 'Field to sort the starred repositories by',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
];
