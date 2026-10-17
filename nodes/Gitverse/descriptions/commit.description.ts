import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'commit';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const commitOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a single commit',
		action: 'Get a commit',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List commits of a repository',
		action: 'Get many commits',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Compare',
		value: 'compare',
		description: 'Compare two branches, tags or commits',
		action: 'Compare two references',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const commitFields: INodeProperties[] = [
	repositoryProperty(scope(['get', 'getAll', 'compare'])),
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'SHA',
		name: 'sha',
		type: 'string',
		required: true,
		default: '',
		description: 'Commit SHA to fetch',
		displayOptions: { show: { resource: [resource], operation: ['get'] } },
	},
	{
		displayName: 'Branch or SHA',
		name: 'sha',
		type: 'string',
		default: '',
		placeholder: 'main',
		description:
			'Branch name or commit SHA to start from. Leave empty for the default branch.',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		default: '',
		placeholder: 'src/index.ts',
		description: 'Only return commits that touched this path',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Base',
		name: 'base',
		type: 'string',
		required: true,
		default: 'main',
		description: 'Base branch, tag or commit',
		displayOptions: { show: { resource: [resource], operation: ['compare'] } },
	},
	{
		displayName: 'Head',
		name: 'head',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature-branch',
		description: 'Head branch, tag or commit to compare against the base',
		displayOptions: { show: { resource: [resource], operation: ['compare'] } },
	},
];
