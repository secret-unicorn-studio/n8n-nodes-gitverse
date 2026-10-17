import {
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

import { branchFields, branchOperations } from './descriptions/branch.description';
import { commitFields, commitOperations } from './descriptions/commit.description';
import { fileFields, fileOperations } from './descriptions/file.description';
import { hookFields, hookOperations } from './descriptions/hook.description';
import { issueFields, issueOperations } from './descriptions/issue.description';
import { labelFields, labelOperations } from './descriptions/label.description';
import { pullRequestFields, pullRequestOperations } from './descriptions/pullRequest.description';
import { releaseFields, releaseOperations } from './descriptions/release.description';
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
		name: 'Hook',
		value: 'hook',
	},
	{
		name: 'Issue',
		value: 'issue',
	},
	{
		name: 'Label',
		value: 'label',
	},
	{
		name: 'Pull Request',
		value: 'pullRequest',
	},
	{
		name: 'Release',
		value: 'release',
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
	...hookOperations,
	...commitOperations,
	...pullRequestOperations,
	...issueOperations,
	...labelOperations,
	...releaseOperations,
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
	...hookFields,
	...commitFields,
	...pullRequestFields,
	...issueFields,
	...labelFields,
	...releaseFields,
];
