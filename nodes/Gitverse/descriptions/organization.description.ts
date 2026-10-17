import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'organization';

const scope = (operation: string[]) => ({ resource: [resource], operation });

export const organizationOperations: INodePropertyOptions[] = [
	{
		name: 'Create Team',
		value: 'createTeam',
		description: 'Create a team in an organization',
		action: 'Create a team',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Issue Types',
		value: 'getIssueTypes',
		description: 'List the issue types of an organization',
		action: 'Get the issue types of an organization',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many Teams',
		value: 'getTeams',
		description: 'List the teams of an organization',
		action: 'Get many teams',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Member',
		value: 'getMember',
		description: 'Check whether a user is a member of an organization',
		action: 'Get an organization member',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Team Members',
		value: 'getTeamMembers',
		description: 'List the members of a team',
		action: 'Get the members of a team',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Team Repositories',
		value: 'getTeamRepos',
		description: 'List the repositories a team has access to',
		action: 'Get the repositories of a team',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Set Team Repository',
		value: 'setTeamRepo',
		description: 'Grant a team access to a repository',
		action: 'Set a repository of a team',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const organizationFields: INodeProperties[] = [
	{
		displayName: 'Organization',
		name: 'organization',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the organization',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		displayName: 'Team',
		name: 'team',
		type: 'string',
		required: true,
		default: '',
		description: 'Slug of the team',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['getTeamMembers', 'getTeamRepos', 'setTeamRepo'],
			},
		},
	},
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		description: 'Login name of the user',
		displayOptions: { show: { resource: [resource], operation: ['getMember'] } },
	},
	...paginationProperties(scope(['getTeams', 'getTeamMembers', 'getTeamRepos'])),
	repositoryProperty(scope(['setTeamRepo'])),

	// Create team
	{
		displayName: 'Name',
		name: 'teamName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the team, Latin letters, digits, dashes, underscores and dots',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Description',
		name: 'teamDescription',
		type: 'string',
		default: '',
		description: 'Description of the team',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Privacy',
		name: 'teamPrivacy',
		type: 'options',
		options: [
			{ name: 'Closed', value: 'closed' },
			{ name: 'Secret', value: 'secret' },
		],
		default: 'closed',
		description: 'Closed teams are visible to the whole organization, secret ones are not',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Notifications',
		name: 'notificationSetting',
		type: 'options',
		options: [
			{ name: 'Disabled', value: 'notifications_disabled' },
			{ name: 'Enabled', value: 'notifications_enabled' },
		],
		default: 'notifications_enabled',
		description: 'Whether the team receives notifications',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Permission',
		name: 'teamPermission',
		type: 'options',
		options: [
			{ name: 'Admin', value: 'admin' },
			{ name: 'Pull', value: 'pull' },
			{ name: 'Push', value: 'push' },
		],
		default: 'pull',
		description: 'Access level of the team',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Can Create Repositories',
		name: 'canCreateOrgRepo',
		type: 'boolean',
		default: false,
		description: 'Whether the team may create repositories in the organization',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Maintainers',
		name: 'maintainers',
		type: 'string',
		default: '',
		placeholder: 'alice, bob',
		description: 'Comma-separated logins of the team maintainers',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},
	{
		displayName: 'Repositories',
		name: 'repoNames',
		type: 'string',
		default: '',
		placeholder: 'my-org/one, my-org/two',
		description: 'Comma-separated repositories in the org/repo format the team gets access to',
		displayOptions: { show: { resource: [resource], operation: ['createTeam'] } },
	},

	// Set team repository
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Admin', value: 'admin' },
			{ name: 'Read', value: 'read' },
			{ name: 'Write', value: 'write' },
		],
		default: 'read',
		description: 'Access level the team gets on the repository',
		displayOptions: { show: { resource: [resource], operation: ['setTeamRepo'] } },
	},
];
