import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'release';

const scope = (operation: string[]) => ({ resource: [resource], operation });

const withReleaseId = [
	'get',
	'update',
	'delete',
	'getAssets',
	'uploadAsset',
	'deleteAsset',
];

export const releaseOperations: INodePropertyOptions[] = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a release in a repository',
		action: 'Create a release',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a release by its ID',
		action: 'Delete a release',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Asset',
		value: 'deleteAsset',
		description: 'Delete a file attached to a release',
		action: 'Delete a release asset',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete by Tag',
		value: 'deleteByTag',
		description: 'Delete a release by its tag',
		action: 'Delete a release by its tag',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a release by its ID',
		action: 'Get a release',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Assets',
		value: 'getAssets',
		description: 'List the files attached to a release',
		action: 'Get the assets of a release',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get by Tag',
		value: 'getByTag',
		description: 'Get a release by its tag',
		action: 'Get a release by its tag',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the releases of a repository',
		action: 'Get many releases',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update a release by its ID',
		action: 'Update a release',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Upload Asset',
		value: 'uploadAsset',
		description: 'Attach a file to a release',
		action: 'Upload a release asset',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const releaseFields: INodeProperties[] = [
	repositoryProperty(scope([])),
	{
		displayName: 'Release ID',
		name: 'releaseId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the release',
		displayOptions: { show: { resource: [resource], operation: withReleaseId } },
	},
	{
		displayName: 'Tag',
		name: 'releaseTag',
		type: 'string',
		required: true,
		default: '',
		description: 'Tag the release points at',
		displayOptions: {
			show: { resource: [resource], operation: ['getByTag', 'deleteByTag'] },
		},
	},
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'number',
		required: true,
		default: 0,
		description: 'ID of the asset to delete',
		displayOptions: { show: { resource: [resource], operation: ['deleteAsset'] } },
	},
	...paginationProperties(scope(['getAll', 'getAssets'])),

	// Create
	{
		displayName: 'Tag Name',
		name: 'tagName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'v1.0.0',
		description: 'Tag the release is created for. The tag is created if it does not exist yet.',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Name',
		name: 'releaseName',
		type: 'string',
		default: '',
		description: 'Title of the release, defaults to the tag name',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Target Commitish',
		name: 'targetCommitish',
		type: 'string',
		default: '',
		placeholder: 'main',
		description: 'Branch or commit the tag points at, defaults to the default branch',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Body',
		name: 'releaseBody',
		type: 'string',
		typeOptions: { rows: 5 },
		default: '',
		description: 'Release notes',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Draft',
		name: 'draft',
		type: 'boolean',
		default: false,
		description: 'Whether the release is a draft',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Prerelease',
		name: 'prerelease',
		type: 'boolean',
		default: false,
		description: 'Whether the release is a prerelease',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Authorized Only',
		name: 'isAuthorizedOnly',
		type: 'boolean',
		default: false,
		description: 'Whether only authorized users can download the attached files',
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
				displayName: 'Authorized Only',
				name: 'isAuthorizedOnly',
				type: 'boolean',
				default: false,
				description: 'Whether only authorized users can download the attached files',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				description: 'Release notes',
			},
			{
				displayName: 'Draft',
				name: 'draft',
				type: 'boolean',
				default: false,
				description: 'Whether the release is a draft',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Title of the release',
			},
			{
				displayName: 'Prerelease',
				name: 'prerelease',
				type: 'boolean',
				default: false,
				description: 'Whether the release is a prerelease',
			},
			{
				displayName: 'Tag Name',
				name: 'tagName',
				type: 'string',
				default: '',
				description: 'Tag the release points at',
			},
			{
				displayName: 'Target Commitish',
				name: 'targetCommitish',
				type: 'string',
				default: '',
				description: 'Branch or commit the tag points at',
			},
		],
	},

	// Assets
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		required: true,
		default: 'data',
		description: 'Name of the binary property holding the file to attach',
		displayOptions: { show: { resource: [resource], operation: ['uploadAsset'] } },
	},
	{
		displayName: 'Asset Name',
		name: 'assetName',
		type: 'string',
		default: '',
		description:
			'Name of the file in the release. Defaults to the name of the uploaded file. Has to contain a file extension, 255 characters at most.',
		displayOptions: { show: { resource: [resource], operation: ['uploadAsset'] } },
	},
];
