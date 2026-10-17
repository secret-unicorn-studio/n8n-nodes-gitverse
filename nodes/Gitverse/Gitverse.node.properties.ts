import {
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

import { branchFields, branchOperations } from './descriptions/branch.description';
import { commitFields, commitOperations } from './descriptions/commit.description';
import { fileFields, fileOperations } from './descriptions/file.description';
import { pullRequestFields, pullRequestOperations } from './descriptions/pullRequest.description';
import { repositoryFields, repositoryOperations } from './descriptions/repository.description';

export const gitverseResources: INodePropertyOptions[] = [
	{
		name: 'Branch',
		value: 'branch',
	},
	{
		name: 'Commit',
		value: 'commit',
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
		name: 'Repository',
		value: 'repository',
	},
];

export const gitverseOperations: INodePropertyOptions[] = [
	...repositoryOperations,
	...branchOperations,
	...fileOperations,
	...commitOperations,
	...pullRequestOperations,
];

export const gitverseNodeProperties: INodeProperties[] = [
	{
		displayName: 'Resource',
		name: 'resource',
		type: 'options',
		noDataExpression: true,
		options: gitverseResources,
		default: 'repository',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: gitverseOperations,
		default: 'get',
	},
	...repositoryFields,
	...branchFields,
	...fileFields,
	...commitFields,
	...pullRequestFields,
];
