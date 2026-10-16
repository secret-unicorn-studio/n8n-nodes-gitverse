import { INodeProperties } from 'n8n-workflow';

export const gitverseNodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Repository',
				value: 'repository',
			},
			{
				name: 'Branch',
				value: 'branch',
			},
			{
				name: 'File',
				value: 'file',
			},
			{
				name: 'Pull Request',
				value: 'pullRequest',
			},
			{
				name: 'Commit',
				value: 'commit',
			},
		],
		default: 'repository',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			// Repository operations
			{
				name: 'Get',
				value: 'get',
				description: 'Get a repository',
				action: 'Get repository',
				displayOptions: {
					show: {
						resource: ['repository'],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all repositories',
				action: 'Get many repositories',
				displayOptions: {
					show: {
						resource: ['repository'],
					},
				},
			},
			// Branch operations
			{
				name: 'Get',
				value: 'get',
				description: 'Get a branch',
				action: 'Get branch',
				displayOptions: {
					show: {
						resource: ['branch'],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all branches',
				action: 'Get many branches',
				displayOptions: {
					show: {
						resource: ['branch'],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new branch',
				action: 'Create branch',
				displayOptions: {
					show: {
						resource: ['branch'],
					},
				},
			},
			// File operations
			{
				name: 'Get',
				value: 'get',
				description: 'Get file content',
				action: 'Get file',
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
			},
			{
				name: 'Create or Update',
				value: 'createOrUpdate',
				description: 'Create or update a file',
				action: 'Create or update file',
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
			},
			// Pull Request operations
			{
				name: 'Get',
				value: 'get',
				description: 'Get a pull request',
				action: 'Get pull request',
				displayOptions: {
					show: {
						resource: ['pullRequest'],
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all pull requests',
				action: 'Get many pull requests',
				displayOptions: {
					show: {
						resource: ['pullRequest'],
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a pull request',
				action: 'Create pull request',
				displayOptions: {
					show: {
						resource: ['pullRequest'],
					},
				},
			},
			{
				name: 'Compare',
				value: 'compare',
				description: 'Compare two branches',
				action: 'Compare branches',
				displayOptions: {
					show: {
						resource: ['pullRequest'],
					},
				},
			},
			// Commit operations
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get all commits',
				action: 'Get many commits',
				displayOptions: {
					show: {
						resource: ['commit'],
					},
				},
			},
		],
		default: 'get',
	},
	// ---- Repository fields ----
	{
		displayName: 'Owner',
		name: 'owner',
		type: 'string',
		required: true,
		default: '',
		description: 'Repository owner (user or organization)',
		hint: 'The owner of the repository',
		displayOptions: {
			show: {
				resource: ['repository', 'branch', 'file', 'pullRequest', 'commit'],
			},
		},
	},
	{
		displayName: 'Repo',
		name: 'repo',
		type: 'string',
		required: true,
		default: '',
		description: 'Repository name',
		hint: 'The name of the repository',
		displayOptions: {
			show: {
				resource: ['repository', 'branch', 'file', 'pullRequest', 'commit'],
			},
		},
	},
	// ---- Branch fields ----
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'main',
		description: 'Branch name',
		displayOptions: {
			show: {
				resource: ['branch'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'New Branch Name',
		name: 'newBranch',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature/new-branch',
		description: 'Name for the new branch',
		displayOptions: {
			show: {
				resource: ['branch'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Base Branch',
		name: 'baseBranch',
		type: 'string',
		required: true,
		default: 'main',
		description: 'Base branch to create from',
		displayOptions: {
			show: {
				resource: ['branch'],
				operation: ['create'],
			},
		},
	},
	// ---- File fields ----
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'README.md',
		description: 'Path to the file in the repository',
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'File content',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['createOrUpdate'],
			},
		},
	},
	{
		displayName: 'Commit Message',
		name: 'commitMessage',
		type: 'string',
		default: 'Update file via n8n',
		description: 'Commit message for the file operation',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['createOrUpdate'],
			},
		},
	},
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'string',
		default: 'main',
		description: 'Branch to create/update the file on',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['createOrUpdate'],
			},
		},
	},
	{
		displayName: 'SHA (to update existing file)',
		name: 'sha',
		type: 'string',
		default: '',
		description:
			'SHA of the file being updated. Required when updating an existing file.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['createOrUpdate'],
			},
		},
	},
	// ---- Pull Request fields ----
	{
		displayName: 'Pull Request Index',
		name: 'prIndex',
		type: 'number',
		required: true,
		default: 0,
		description: 'Pull request index (number)',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'Head',
		name: 'head',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature-branch',
		description: 'Head branch (source branch for the PR)',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Base',
		name: 'base',
		type: 'string',
		required: true,
		default: 'main',
		placeholder: 'main',
		description: 'Base branch (target branch for the PR)',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		description: 'Pull request title',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		description: 'Pull request body/description',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Maintainer Can Modify',
		name: 'maintainerCanModify',
		type: 'boolean',
		default: true,
		description:
			'Allow maintainers to modify the PR (allow commits from contributors)',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['create'],
			},
		},
	},
	// ---- Compare fields ----
	{
		displayName: 'Base Branch',
		name: 'baseBranch',
		type: 'string',
		required: true,
		default: 'main',
		description: 'Base branch for comparison',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['compare'],
			},
		},
	},
	{
		displayName: 'Head Branch',
		name: 'headBranch',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feature-branch',
		description: 'Head branch for comparison',
		displayOptions: {
			show: {
				resource: ['pullRequest'],
				operation: ['compare'],
			},
		},
	},
	// ---- List filters ----
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Source',
						value: 'source',
					},
					{
						name: 'Fork',
						value: 'fork',
					},
					{
						name: 'Private',
						value: 'private',
					},
				],
				default: 'all',
				description: 'Repository type filter',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				options: [
					{
						name: 'Ascending',
						value: 'asc',
					},
					{
						name: 'Descending',
						value: 'desc',
					},
				],
				default: 'asc',
				description: 'Sort order',
			},
			{
				displayName: 'Page Size',
				name: 'perPage',
				type: 'number',
				default: 50,
				description: 'Number of items per page (max 100)',
			},
		],
		displayOptions: {
			show: {
				resource: ['repository', 'branch', 'pullRequest', 'commit'],
				operation: ['getAll'],
			},
		},
	},
];
