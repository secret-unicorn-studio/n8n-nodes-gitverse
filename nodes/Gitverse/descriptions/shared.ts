import { INodeProperties } from 'n8n-workflow';

export interface PropertyScope {
	resource: string[];
	operation: string[];
}

/**
 * Repository picker shared by every resource. Kept as a `resourceLocator` so the
 * user can pick from a searchable list, paste a repository URL or type `owner/repo`.
 */
export function repositoryProperty(scope: PropertyScope): INodeProperties {
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
				resource: scope.resource,
				...(scope.operation.length > 0 ? { operation: scope.operation } : {}),
			},
		},
	};
}

/**
 * Branch picker: a searchable list of the branches of the selected repository,
 * or a free-text name for branches that do not exist yet.
 */
export function branchProperty(
	scope: PropertyScope,
	name = 'branch',
	displayName = 'Branch'
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		default: { mode: 'list', value: 'main' },
		required: true,
		description: 'Branch to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a branch...',
				typeOptions: {
					searchListMethod: 'searchBranches',
					searchable: true,
				},
			},
			{
				displayName: 'By Name',
				name: 'name',
				type: 'string',
				placeholder: 'main',
				extractValue: {
					type: 'regex',
					regex: '^\\s*(\\S+)\\s*$',
				},
			},
		],
		displayOptions: {
			show: {
				resource: scope.resource,
				operation: scope.operation,
			},
		},
	};
}

/**
 * `returnAll` / `limit` pair used by every list operation.
 */
export function paginationProperties(scope: PropertyScope): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: {
				show: {
					resource: scope.resource,
					operation: scope.operation,
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: {
				minValue: 1,
			},
			default: 50,
			description: 'Max number of results to return',
			displayOptions: {
				show: {
					resource: scope.resource,
					operation: scope.operation,
					returnAll: [false],
				},
			},
		},
	];
}


