import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'label';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const labelOperations: INodePropertyOptions[] = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a label in a repository',
		action: 'Create a label',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a label by its name',
		action: 'Get a label',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the labels of a repository',
		action: 'Get many labels',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update a label, rename included',
		action: 'Update a label',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const labelFields: INodeProperties[] = [
	repositoryProperty(scope([])),
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the label',
		displayOptions: {
			show: { resource: [resource], operation: ['get', 'create', 'update'] },
		},
	},
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'string',
		default: '',
		description: 'Field to sort the labels by',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Color',
		name: 'color',
		type: 'color',
		default: 'EDEDED',
		description: 'Colour of the label. The leading # is added automatically if missing.',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Description',
		name: 'labelDescription',
		type: 'string',
		default: '',
		description: 'Description of the label, at most 100 characters',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Exclusive',
		name: 'exclusive',
		type: 'boolean',
		default: false,
		description: 'Whether the label is exclusive',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: 'EDEDED',
				description: 'New colour of the label',
			},
			{
				displayName: 'Description',
				name: 'labelDescription',
				type: 'string',
				default: '',
				description: 'New description of the label, at most 100 characters',
			},
			{
				displayName: 'Exclusive',
				name: 'exclusive',
				type: 'boolean',
				default: false,
				description: 'Whether the label is exclusive',
			},
			{
				displayName: 'New Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name of the label',
			},
		],
	},
];
