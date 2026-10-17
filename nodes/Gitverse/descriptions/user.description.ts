import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties } from './shared';

const resource = 'user';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const userOperations: INodePropertyOptions[] = [
	{
		name: 'Add Emails',
		value: 'addEmails',
		description: 'Add email addresses to the authenticated account',
		action: 'Add user emails',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Emails',
		value: 'deleteEmails',
		description: 'Remove email addresses from the authenticated account',
		action: 'Delete user emails',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get the authenticated user',
		action: 'Get the authenticated user',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get by ID',
		value: 'getById',
		description: 'Get a user by the numeric account ID',
		action: 'Get a user by ID',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get by Login',
		value: 'getByLogin',
		description: 'Get a user by the login name',
		action: 'Get a user by login',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Emails',
		value: 'getEmails',
		description: 'List the email addresses of the authenticated account',
		action: 'Get user emails',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Search',
		value: 'search',
		description: 'Search for users',
		action: 'Search users',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const userFields: INodeProperties[] = [
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		description: 'Login name of the user',
		displayOptions: { show: { resource: [resource], operation: ['getByLogin'] } },
	},
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the account',
		displayOptions: { show: { resource: [resource], operation: ['getById'] } },
	},
	...paginationProperties(scope(['getEmails', 'search'])),
	{
		displayName: 'Emails',
		name: 'emails',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'alice@example.com, bob@example.com',
		description: 'Comma-separated email addresses, at most ten per request',
		displayOptions: {
			show: { resource: [resource], operation: ['addEmails', 'deleteEmails'] },
		},
	},
	{
		displayName: 'Query',
		name: 'searchQuery',
		type: 'string',
		required: true,
		default: '',
		description: 'Search query, at least part of the login',
		displayOptions: { show: { resource: [resource], operation: ['search'] } },
	},
	{
		displayName: 'Sort',
		name: 'searchSort',
		type: 'options',
		options: [
			{ name: 'Best Match', value: 'best_match' },
			{ name: 'Followers', value: 'followers' },
			{ name: 'Joined', value: 'joined' },
			{ name: 'Repositories', value: 'repositories' },
		],
		default: 'best_match',
		description: 'Field to sort the results by',
		displayOptions: { show: { resource: [resource], operation: ['search'] } },
	},
	{
		displayName: 'Direction',
		name: 'searchOrder',
		type: 'options',
		options: [
			{ name: 'Ascending', value: 'asc' },
			{ name: 'Descending', value: 'desc' },
		],
		default: 'desc',
		description: 'Sort direction',
		displayOptions: { show: { resource: [resource], operation: ['search'] } },
	},
];
