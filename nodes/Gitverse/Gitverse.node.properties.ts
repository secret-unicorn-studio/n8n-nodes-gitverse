import {
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';

import { branchFields, branchOperations } from './descriptions/branch.description';
import { commitFields, commitOperations } from './descriptions/commit.description';
import {
	assignmentFields,
	assignmentOperations,
} from './descriptions/assignment.description';
import { fileFields, fileOperations } from './descriptions/file.description';
import { hookFields, hookOperations } from './descriptions/hook.description';
import { issueFields, issueOperations } from './descriptions/issue.description';
import { labelFields, labelOperations } from './descriptions/label.description';
import {
	organizationFields,
	organizationOperations,
} from './descriptions/organization.description';
import { projectFields, projectOperations } from './descriptions/project.description';
import { packageFields, packageOperations } from './descriptions/package.description';
import { pullRequestFields, pullRequestOperations } from './descriptions/pullRequest.description';
import { releaseFields, releaseOperations } from './descriptions/release.description';
import { repositoryFields, repositoryOperations } from './descriptions/repository.description';
import { starFields, starOperations } from './descriptions/star.description';
import { userFields, userOperations } from './descriptions/user.description';

export const gitverseResources: INodePropertyOptions[] = [
	{
		name: 'Assignment',
		value: 'assignment',
	},
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
		name: 'Organization',
		value: 'organization',
	},
	{
		name: 'Package',
		value: 'package',
	},
	{
		name: 'Project',
		value: 'project',
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
	{
		name: 'Star',
		value: 'star',
	},
	{
		name: 'User',
		value: 'user',
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
	...userOperations,
	...organizationOperations,
	...projectOperations,
	...assignmentOperations,
	...packageOperations,
	...starOperations,
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
	...userFields,
	...organizationFields,
	...projectFields,
	...assignmentFields,
	...packageFields,
	...starFields,
];
