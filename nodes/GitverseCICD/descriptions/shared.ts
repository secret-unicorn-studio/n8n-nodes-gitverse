import { INodeProperties } from 'n8n-workflow';

import { paginationProperties } from '../../Gitverse/descriptions/shared';

/**
 * Repository picker that only shows up when the resource works on a repository
 * rather than on an organization.
 */
export function scopedRepositoryProperty(resource: string): INodeProperties {
	return {
		displayName: 'Repository',
		name: 'repository',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'Repository to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a repository...',
				typeOptions: {
					searchListMethod: 'searchRepositories',
					searchable: true,
				},
			},
			{
				displayName: 'By URL',
				name: 'url',
				type: 'string',
				placeholder: 'https://gitverse.ru/owner/repo',
				extractValue: {
					type: 'regex',
					regex: 'https?://[^/]+/([^/]+/[^/?#]+)',
				},
			},
			{
				displayName: 'By Name',
				name: 'name',
				type: 'string',
				placeholder: 'owner/repo',
				extractValue: {
					type: 'regex',
					regex: '([^/]+/[^/?#]+)',
				},
			},
		],
		displayOptions: {
			show: {
				resource: [resource],
				scope: ['repository'],
			},
		},
	};
}

/**
 * Organization name, shown when the resource is pointed at an organization.
 */
export function organizationProperty(resource: string): INodeProperties {
	return {
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the organization',
		displayOptions: {
			show: {
				resource: [resource],
				scope: ['organization'],
			},
		},
	};
}

/**
 * Repository or organization switch shared by the settings resources.
 */
export function scopeProperty(resource: string): INodeProperties {
	return {
		displayName: 'Scope',
		name: 'scope',
		type: 'options',
		options: [
			{ name: 'Organization', value: 'organization' },
			{ name: 'Repository', value: 'repository' },
		],
		default: 'repository',
		description: 'Whether the settings belong to a repository or to an organization',
		displayOptions: { show: { resource: [resource] } },
	};
}

/**
 * `returnAll` / `limit` pair scoped to one resource of this node.
 */
export function cicdPagination(resource: string, operations: string[]): INodeProperties[] {
	return paginationProperties({ resource: [resource], operation: operations });
}
