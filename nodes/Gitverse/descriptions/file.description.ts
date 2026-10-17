import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { repositoryProperty } from './shared';

const resource = 'file';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const fileOperations: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get the content of a file or list a directory',
		action: 'Get a file',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create or Update',
		value: 'createOrUpdate',
		description: 'Create or update a file',
		action: 'Create or update a file',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a file',
		action: 'Delete a file',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const fileFields: INodeProperties[] = [
	repositoryProperty(scope(['get', 'createOrUpdate', 'delete'])),
	{
		displayName: 'File Path',
		name: 'filePath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'folder/README.md',
		description: 'Path of the file or directory. Leave empty to list the repository root.',
		displayOptions: {
			show: { resource: [resource], operation: ['get', 'createOrUpdate', 'delete'] },
		},
	},
	{
		displayName: 'Reference',
		name: 'ref',
		type: 'string',
		default: '',
		placeholder: 'main',
		description: 'Branch, tag or commit to read from. Defaults to the repository default branch.',
		displayOptions: { show: { resource: [resource], operation: ['get'] } },
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: { rows: 5 },
		default: '',
		description: 'File content',
		displayOptions: { show: { resource: [resource], operation: ['createOrUpdate'] } },
	},
	{
		displayName: 'Commit Message',
		name: 'commitMessage',
		type: 'string',
		default: 'Update file via n8n',
		description: 'Commit message for the change',
		displayOptions: {
			show: { resource: [resource], operation: ['createOrUpdate', 'delete'] },
		},
	},
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'string',
		default: '',
		placeholder: 'main',
		description: 'Branch to commit to. Defaults to the repository default branch.',
		displayOptions: {
			show: { resource: [resource], operation: ['createOrUpdate', 'delete'] },
		},
	},
	{
		displayName: 'SHA',
		name: 'sha',
		type: 'string',
		default: '',
		description:
			'SHA of the file being replaced. Required when updating or deleting an existing file.',
		displayOptions: {
			show: { resource: [resource], operation: ['createOrUpdate', 'delete'] },
		},
	},
];
