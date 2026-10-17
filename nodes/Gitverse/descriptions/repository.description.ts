import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'repository';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const repositoryOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a repository',
		action: 'Get a repository',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List repositories the token owner can access',
		action: 'Get many repositories',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create',
		value: 'create',
		description: 'Create a repository for a user or an organization',
		action: 'Create a repository',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update repository settings',
		action: 'Update a repository',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a repository',
		action: 'Delete a repository',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Collaborators',
		value: 'getCollaborators',
		description: 'List the collaborators of a repository',
		action: 'Get many collaborators',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Add Collaborator',
		value: 'addCollaborator',
		description: 'Grant a user access to a repository',
		action: 'Add a collaborator',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Languages',
		value: 'getLanguages',
		description: 'Get the language breakdown of a repository',
		action: 'Get repository languages',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Fork',
		value: 'fork',
		description: 'Fork a repository',
		action: 'Fork a repository',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const repositoryFields: INodeProperties[] = [
	repositoryProperty({
		resource: [resource],
		operation: [
			'get',
			'update',
			'delete',
			'getCollaborators',
			'addCollaborator',
			'getLanguages',
			'fork',
		],
	}),
	...paginationProperties(scope(['getAll'])),
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		default: '',
		description:
			'List repositories of this organization instead of the repositories of the token owner',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	// ---- Create ----
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the new repository',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		default: '',
		description: 'Create the repository inside this organization instead of the token owner',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Repository description',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Private',
		name: 'private',
		type: 'boolean',
		default: false,
		description: 'Whether the repository is private',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Initialize With README',
		name: 'autoInit',
		type: 'boolean',
		default: false,
		description: 'Whether to create the repository with an initial commit',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	// ---- Update ----
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether the repository is archived',
			},
			{
				displayName: 'Default Branch',
				name: 'defaultBranch',
				type: 'string',
				default: '',
				description: 'Branch used as the repository default',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Repository description',
			},
			{
				displayName: 'Has Issues',
				name: 'hasIssues',
				type: 'boolean',
				default: true,
				description: 'Whether the issue tracker is enabled',
			},
			{
				displayName: 'Has Pull Requests',
				name: 'hasPullRequests',
				type: 'boolean',
				default: true,
				description: 'Whether pull requests are enabled',
			},
			{
				displayName: 'Has Wiki',
				name: 'hasWiki',
				type: 'boolean',
				default: true,
				description: 'Whether the wiki is enabled',
			},
			{
				displayName: 'Private',
				name: 'private',
				type: 'boolean',
				default: false,
				description: 'Whether the repository is private',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Repository website',
			},
		],
		displayOptions: { show: { resource: [resource], operation: ['update'] } },
	},
	// ---- Collaborators ----
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		description: 'User to grant access to',
		displayOptions: { show: { resource: [resource], operation: ['addCollaborator'] } },
	},
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Read', value: 'read' },
			{ name: 'Write', value: 'write' },
			{ name: 'Admin', value: 'admin' },
		],
		default: 'write',
		description: 'Permission level granted to the collaborator',
		displayOptions: { show: { resource: [resource], operation: ['addCollaborator'] } },
	},
	// ---- Fork ----
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		default: '',
		description: 'Fork into this organization instead of the token owner account',
		displayOptions: { show: { resource: [resource], operation: ['fork'] } },
	},
];
