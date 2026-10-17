import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const resource = 'package';

const allOperations = ['getVersions', 'deleteVersion', 'delete'];

export const packageOperations: INodePropertyOptions[] = [
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a package with all of its versions',
		action: 'Delete a package',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Version',
		value: 'deleteVersion',
		description: 'Delete a single version of a package',
		action: 'Delete a package version',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Versions',
		value: 'getVersions',
		description: 'List the versions of a package',
		action: 'Get the versions of a package',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const packageFields: INodeProperties[] = [
	{
		displayName: 'Owner Type',
		name: 'ownerType',
		type: 'options',
		options: [
			{ name: 'Organization', value: 'organization' },
			{ name: 'User', value: 'user' },
		],
		default: 'user',
		description: 'Packages are either owned by a user or by an organization',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		description: 'Login of the user owning the package',
		displayOptions: {
			show: { resource: [resource], operation: allOperations, ownerType: ['user'] },
		},
	},
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the organization owning the package',
		displayOptions: {
			show: {
				resource: [resource],
				operation: allOperations,
				ownerType: ['organization'],
			},
		},
	},
	{
		displayName: 'Package Type',
		name: 'packageType',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'npm',
		description: 'Type of the registry the package lives in, for example npm',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		displayName: 'Package Name',
		name: 'packageName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the package',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		displayName: 'Version ID',
		name: 'versionId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the package version',
		displayOptions: { show: { resource: [resource], operation: ['deleteVersion'] } },
	},
];
