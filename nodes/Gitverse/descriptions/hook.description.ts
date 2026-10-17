import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'hook';

const scope = (operation: string[]) => ({ resource: [resource], operation });

/** Events the Gitverse hook API accepts, see `HOOK_EVENTS` in the operations. */
export const hookEventOptions = [
	{ name: 'Branch or Tag Created', value: 'create' },
	{ name: 'Branch or Tag Deleted', value: 'delete' },
	{ name: 'Fork', value: 'fork' },
	{ name: 'Pull Request', value: 'pull_request' },
	{ name: 'Pull Request Comment', value: 'pull_request_comment' },
	{ name: 'Pull Request Review', value: 'pull_request_review' },
	{ name: 'Push', value: 'push' },
];

export const hookOperations: INodePropertyOptions[] = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a webhook on a repository',
		action: 'Create a webhook',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a webhook of a repository',
		action: 'Delete a webhook',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a webhook by its ID',
		action: 'Get a webhook',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the webhooks of a repository',
		action: 'Get many webhooks',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update a webhook of a repository',
		action: 'Update a webhook',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const hookFields: INodeProperties[] = [
	repositoryProperty(scope([])),
	{
		displayName: 'Hook ID',
		name: 'hookId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the webhook',
		displayOptions: {
			show: { resource: [resource], operation: ['get', 'update', 'delete'] },
		},
	},
	...paginationProperties(scope(['getAll'])),

	// Create
	{
		displayName: 'Payload URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/webhook',
		description: 'URL that receives the event payloads',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: hookEventOptions,
		default: ['push'],
		description: 'Events the webhook is triggered for',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		default: true,
		description: 'Whether the webhook delivers events',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{ name: 'Form', value: 'form' },
			{ name: 'JSON', value: 'json' },
		],
		default: 'json',
		description: 'Format of the delivered payload',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'HTTP Method',
		name: 'httpMethod',
		type: 'options',
		options: [
			{ name: 'POST', value: 'POST' },
			{ name: 'GET', value: 'GET' },
		],
		default: 'POST',
		description: 'HTTP method of the delivery request',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Authorization Header',
		name: 'authorizationHeader',
		type: 'string',
		default: '',
		description: 'Value sent in the Authorization header of every delivery',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Branch Filter',
		name: 'branchFilter',
		type: 'string',
		default: '',
		placeholder: 'main, release/*',
		description: 'Only deliver events of branches matching this filter',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},

	// Update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
		options: [
			{
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook delivers events',
			},
			{
				displayName: 'Add Events',
				name: 'addEvents',
				type: 'multiOptions',
				options: hookEventOptions,
				default: [],
				description: 'Events to add to the webhook',
			},
			{
				displayName: 'Authorization Header',
				name: 'authorizationHeader',
				type: 'string',
				default: '',
				description: 'Value sent in the Authorization header of every delivery',
			},
			{
				displayName: 'Branch Filter',
				name: 'branchFilter',
				type: 'string',
				default: '',
				placeholder: 'main, release/*',
				description: 'Only deliver events of branches matching this filter',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				options: [
					{ name: 'Form', value: 'form' },
					{ name: 'JSON', value: 'json' },
				],
				default: 'json',
				description: 'Format of the delivered payload',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: hookEventOptions,
				default: [],
				description: 'Events the webhook is triggered for. Replaces the current list.',
			},
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				options: [
					{ name: 'POST', value: 'POST' },
					{ name: 'GET', value: 'GET' },
				],
				default: 'POST',
				description: 'HTTP method of the delivery request',
			},
			{
				displayName: 'Payload URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/webhook',
				description: 'URL that receives the event payloads',
			},
			{
				displayName: 'Remove Events',
				name: 'removeEvents',
				type: 'multiOptions',
				options: hookEventOptions,
				default: [],
				description: 'Events to remove from the webhook',
			},
		],
	},
];
