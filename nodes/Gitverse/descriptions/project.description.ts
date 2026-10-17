import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { repositoryProperty } from './shared';

const resource = 'project';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const projectOperations: INodePropertyOptions[] = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a project in a repository',
		action: 'Create a project',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create Column',
		value: 'createColumn',
		description: 'Add a column to a project',
		action: 'Create a project column',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a project',
		action: 'Delete a project',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Column',
		value: 'deleteColumn',
		description: 'Delete a column of a project',
		action: 'Delete a project column',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a project by its ID',
		action: 'Get a project',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the projects of a repository',
		action: 'Get many projects',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update a project',
		action: 'Update a project',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update Column',
		value: 'updateColumn',
		description: 'Update a column of a project',
		action: 'Update a project column',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const projectFields: INodeProperties[] = [
	repositoryProperty(scope([])),
	{
		displayName: 'Project ID',
		name: 'projectId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the project',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['get', 'update', 'delete', 'createColumn', 'updateColumn', 'deleteColumn'],
			},
		},
	},
	{
		displayName: 'Column ID',
		name: 'columnId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the column',
		displayOptions: {
			show: { resource: [resource], operation: ['updateColumn', 'deleteColumn'] },
		},
	},

	// Create project
	{
		displayName: 'Title',
		name: 'projectTitle',
		type: 'string',
		required: true,
		default: '',
		description: 'Title of the project',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Description',
		name: 'projectDescription',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Description of the project',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Private',
		name: 'projectPrivate',
		type: 'boolean',
		default: false,
		description: 'Whether the project is only visible to its members',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Template',
		name: 'templateType',
		type: 'options',
		options: [
			{ name: 'Empty', value: 0 },
			{ name: 'Kanban', value: 1 },
		],
		default: 0,
		description: 'Whether the project starts with the standard Kanban columns',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},

	// Update project
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Description of the project',
			},
			{
				displayName: 'Private',
				name: 'private',
				type: 'boolean',
				default: false,
				description: 'Whether the project is only visible to its members',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
				],
				default: 'open',
				description: 'Closed projects only show up in the project list with State All',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the project',
			},
		],
	},

	// Columns
	{
		displayName: 'Title',
		name: 'columnTitle',
		type: 'string',
		required: true,
		default: '',
		description: 'Title of the column',
		displayOptions: { show: { resource: [resource], operation: ['createColumn'] } },
	},
	{
		displayName: 'Color',
		name: 'columnColor',
		type: 'color',
		default: '8250DF',
		description: 'Colour of the column. The leading # is added if it is missing.',
		displayOptions: { show: { resource: [resource], operation: ['createColumn'] } },
	},
	{
		displayName: 'Column Fields',
		name: 'columnFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['updateColumn'] } },
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '8250DF',
				description: 'Colour of the column',
			},
			{
				displayName: 'Default',
				name: 'default',
				type: 'boolean',
				default: false,
				description: 'Whether the column is the default one for new tasks',
			},
			{
				displayName: 'Sorting',
				name: 'sorting',
				type: 'number',
				default: 0,
				description: 'Position of the column on the board',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the column',
			},
		],
	},
];
