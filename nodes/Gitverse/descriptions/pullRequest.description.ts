import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'pullRequest';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const pullRequestOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a pull request',
		action: 'Get a pull request',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List pull requests of a repository',
		action: 'Get many pull requests',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create',
		value: 'create',
		description: 'Create a pull request',
		action: 'Create a pull request',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const pullRequestFields: INodeProperties[] = [
	repositoryProperty(scope(['get', 'getAll', 'create'])),
	{
		displayName: 'Pull Request Number',
		name: 'pullRequestNumber',
		type: 'number',
		required: true,
		default: 0,
		description: 'Number of the pull request',
		displayOptions: { show: { resource: [resource], operation: ['get'] } },
	},
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Closed', value: 'closed' },
			{ name: 'Open', value: 'open' },
		],
		default: 'open',
		description: 'Only return pull requests in this state',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		description: 'Title of the pull request',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Head',
		name: 'head',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature-branch',
		description: 'Branch containing the changes',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Base',
		name: 'base',
		type: 'string',
		required: true,
		default: 'main',
		description: 'Branch the changes should be merged into',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 5 },
		default: '',
		description: 'Description of the pull request',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
];
