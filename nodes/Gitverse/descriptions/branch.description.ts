import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { branchProperty, paginationProperties, repositoryProperty } from './shared';

const resource = 'branch';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const branchOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a branch',
		action: 'Get a branch',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the branches of a repository',
		action: 'Get many branches',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create',
		value: 'create',
		description: 'Create a branch from a base branch',
		action: 'Create a branch',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a branch',
		action: 'Delete a branch',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const branchFields: INodeProperties[] = [
	repositoryProperty(scope(['get', 'getAll', 'create', 'delete'])),
	branchProperty(scope(['get', 'delete'])),
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'New Branch Name',
		name: 'newBranch',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature/new-branch',
		description: 'Name for the new branch',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Base Branch',
		name: 'baseBranch',
		type: 'string',
		required: true,
		default: 'main',
		description: 'Branch the new branch is created from',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
];
