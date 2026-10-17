import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import { paginationProperties, repositoryProperty } from './shared';

const resource = 'issue';

const scope = (operation: string[]) => ({ resource: [resource], operation });

const withIssueNumber = [
	'get',
	'update',
	'getComments',
	'createComment',
	'updateComment',
	'deleteComment',
	'addCommentReaction',
	'deleteCommentReaction',
	'getTimeline',
	'getLabels',
	'addAttachment',
	'deleteAttachment',
	'getParent',
	'getSubIssues',
	'addSubIssue',
	'removeSubIssue',
	'getDevelopment',
	'linkDevelopment',
	'unlinkDevelopment',
	'addReaction',
];

const withCommentId = [
	'getComment',
	'updateComment',
	'deleteComment',
	'addCommentReaction',
	'deleteCommentReaction',
	'addCommentAttachment',
	'deleteCommentAttachment',
];

export const issueOperations: INodePropertyOptions[] = [
	{
		name: 'Add Attachment',
		value: 'addAttachment',
		description: 'Attach a file to an issue',
		action: 'Add an attachment to an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Add Comment Attachment',
		value: 'addCommentAttachment',
		description: 'Attach a file to an issue comment',
		action: 'Add an attachment to an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Add Comment Reaction',
		value: 'addCommentReaction',
		description: 'Add a reaction to an issue comment',
		action: 'Add a reaction to an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Add Reaction',
		value: 'addReaction',
		description: 'Add a reaction to an issue',
		action: 'Add a reaction to an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Add Sub-Issue',
		value: 'addSubIssue',
		description: 'Link a child issue to a parent issue',
		action: 'Add a sub-issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create',
		value: 'create',
		description: 'Create an issue',
		action: 'Create an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Create Comment',
		value: 'createComment',
		description: 'Add a comment to an issue',
		action: 'Create an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Attachment',
		value: 'deleteAttachment',
		description: 'Delete an attachment of an issue',
		action: 'Delete an issue attachment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Comment',
		value: 'deleteComment',
		description: 'Delete a comment of an issue',
		action: 'Delete an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Comment Attachment',
		value: 'deleteCommentAttachment',
		description: 'Delete an attachment of an issue comment',
		action: 'Delete an issue comment attachment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Comment Reaction',
		value: 'deleteCommentReaction',
		description: 'Remove a reaction from an issue comment',
		action: 'Delete an issue comment reaction',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Delete Many',
		value: 'bulkDelete',
		description: 'Permanently delete several issues at once',
		action: 'Delete many issues',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get an issue',
		action: 'Get an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Bulk Values',
		value: 'bulkValues',
		description: 'Get the bulk values of several issues',
		action: 'Get the bulk values of issues',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Comment',
		value: 'getComment',
		description: 'Get a comment by its ID, without knowing the issue',
		action: 'Get an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Comments',
		value: 'getComments',
		description: 'List the comments of an issue',
		action: 'Get the comments of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Development',
		value: 'getDevelopment',
		description: 'List the pull requests and branches linked to an issue',
		action: 'Get the development links of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Labels',
		value: 'getLabels',
		description: 'List the labels of an issue',
		action: 'Get the labels of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List issues of a repository',
		action: 'Get many issues',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Parent',
		value: 'getParent',
		description: 'Get the parent of a child issue',
		action: 'Get the parent of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Sub-Issues',
		value: 'getSubIssues',
		description: 'List the child issues of an issue',
		action: 'Get the sub-issues of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Get Timeline',
		value: 'getTimeline',
		description: 'List the timeline of an issue, comments included',
		action: 'Get the timeline of an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Link Development',
		value: 'linkDevelopment',
		description: 'Link pull requests and branches to an issue',
		action: 'Link development to an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Remove Sub-Issue',
		value: 'removeSubIssue',
		description: 'Unlink a child issue from a parent issue',
		action: 'Remove a sub-issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Unlink Development',
		value: 'unlinkDevelopment',
		description: 'Unlink pull requests and branches from an issue',
		action: 'Unlink development from an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update an issue',
		action: 'Update an issue',
		displayOptions: { show: { resource: [resource] } },
	},
	{
		name: 'Update Comment',
		value: 'updateComment',
		description: 'Update a comment of an issue',
		action: 'Update an issue comment',
		displayOptions: { show: { resource: [resource] } },
	},
];

export const issueFields: INodeProperties[] = [
	repositoryProperty(scope([])),
	{
		displayName: 'Issue Number',
		name: 'issueNumber',
		type: 'number',
		required: true,
		default: 0,
		description: 'Number of the issue',
		displayOptions: { show: { resource: [resource], operation: withIssueNumber } },
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'number',
		required: true,
		default: 0,
		description: 'ID of the comment',
		displayOptions: { show: { resource: [resource], operation: withCommentId } },
	},
	{
		displayName: 'Reaction ID',
		name: 'reactionId',
		type: 'number',
		required: true,
		default: 0,
		description: 'ID of the reaction to remove',
		displayOptions: {
			show: { resource: [resource], operation: ['deleteCommentReaction'] },
		},
	},
	{
		displayName: 'Attachment ID',
		name: 'attachmentId',
		type: 'number',
		required: true,
		default: 0,
		description: 'ID of the attachment to delete',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['deleteAttachment', 'deleteCommentAttachment'],
			},
		},
	},
	...paginationProperties(scope(['getAll', 'getTimeline', 'getSubIssues'])),

	// Get Many filters
	{
		displayName: 'State',
		name: 'state',
		type: 'options',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Closed', value: 'closed' },
			{ name: 'Open', value: 'open' },
		],
		default: 'all',
		description: 'Only return issues in this state',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Assignee',
		name: 'assignee',
		type: 'string',
		default: '',
		description: 'Only return issues assigned to this user',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Type',
		name: 'issueType',
		type: 'options',
		options: [
			{ name: 'Bug', value: 'bug' },
			{ name: 'Epic', value: 'epic' },
			{ name: 'Story', value: 'story' },
			{ name: 'Task', value: 'task' },
		],
		default: 'task',
		description: 'Only return issues of this type',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Creator',
		name: 'creator',
		type: 'string',
		default: '',
		description: 'Only return issues opened by this user',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Labels',
		name: 'labels',
		type: 'string',
		default: '',
		placeholder: 'bug, ui',
		description:
			'Comma-separated label names. Only issues carrying every listed label are returned.',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		options: [
			{ name: 'Comments', value: 'comments' },
			{ name: 'Created', value: 'created' },
			{ name: 'Due Date', value: 'due_date' },
			{ name: 'Updated', value: 'updated' },
		],
		default: 'created',
		description: 'Field to sort the results by',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},
	{
		displayName: 'Direction',
		name: 'direction',
		type: 'options',
		options: [
			{ name: 'Ascending', value: 'asc' },
			{ name: 'Descending', value: 'desc' },
		],
		default: 'desc',
		description: 'Sort direction',
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
	},

	// Time filters
	{
		displayName: 'Since',
		name: 'since',
		type: 'string',
		default: '',
		placeholder: '2025-01-01T00:00:00Z',
		description: 'Only return entries updated after this RFC 3339 timestamp',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['getAll', 'getComments', 'getTimeline'],
			},
		},
	},
	{
		displayName: 'Before',
		name: 'before',
		type: 'string',
		default: '',
		placeholder: '2025-01-01T00:00:00Z',
		description: 'Only return entries created before this RFC 3339 timestamp',
		displayOptions: {
			show: { resource: [resource], operation: ['getComments', 'getTimeline'] },
		},
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
				displayName: 'Assignees',
				name: 'assignees',
				type: 'string',
				default: '',
				placeholder: 'alice, bob',
				description:
					'Comma-separated usernames to assign. Leave empty to remove every assignee.',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				typeOptions: { rows: 5 },
				default: '',
				description: 'Description of the issue',
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				placeholder: 'bug, ui',
				description: 'Comma-separated label names. Leave empty to remove every label.',
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'number',
				default: 0,
				description: 'Move the issue into this project, leave 0 to keep the current one',
			},
			{
				displayName: 'Project Status ID',
				name: 'projectStatusId',
				type: 'number',
				default: 0,
				description:
					'Move the issue into this column of the project. Requires Project ID for a project other than the current one.',
			},
			{
				displayName: 'Remove From Project',
				name: 'removeFromProject',
				type: 'boolean',
				default: false,
				description:
					'Whether to move the issue out of its project. Overrides Project ID and Project Status ID.',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				options: [
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
				],
				default: 'open',
				description: 'New state of the issue',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title of the issue',
			},
			{
				displayName: 'Type',
				name: 'issueType',
				type: 'options',
				options: [
					{ name: 'Bug', value: 'bug' },
					{ name: 'Epic', value: 'epic' },
					{ name: 'Story', value: 'story' },
					{ name: 'Task', value: 'task' },
				],
				default: 'task',
				description: 'Type of the issue',
			},
		],
	},

	// Comments
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		description: 'Text of the comment',
		displayOptions: {
			show: { resource: [resource], operation: ['createComment', 'updateComment'] },
		},
	},
	{
		displayName: 'Reply To',
		name: 'replyTo',
		type: 'number',
		default: 0,
		description: 'ID of the comment this one replies to',
		displayOptions: { show: { resource: [resource], operation: ['createComment'] } },
	},
	{
		displayName: 'Thread ID',
		name: 'threadId',
		type: 'number',
		default: 0,
		description: 'ID of the thread to reply in',
		displayOptions: { show: { resource: [resource], operation: ['createComment'] } },
	},
	{
		displayName: 'Is Review',
		name: 'isReview',
		type: 'boolean',
		default: false,
		description: 'Whether the comment is a code review. Cannot be combined with Is Thread.',
		displayOptions: { show: { resource: [resource], operation: ['createComment'] } },
	},
	{
		displayName: 'Is Thread',
		name: 'isThread',
		type: 'boolean',
		default: false,
		description: 'Whether the comment is a thread. Cannot be combined with Is Review.',
		displayOptions: { show: { resource: [resource], operation: ['createComment'] } },
	},
	{
		displayName: 'Reaction',
		name: 'reaction',
		type: 'options',
		options: [
			{ name: 'Confused', value: 'confused' },
			{ name: 'Eyes', value: 'eyes' },
			{ name: 'Heart', value: 'heart' },
			{ name: 'Hooray', value: 'hooray' },
			{ name: 'Laugh', value: 'laugh' },
			{ name: 'Rocket', value: 'rocket' },
			{ name: 'Thumbs Down', value: '-1' },
			{ name: 'Thumbs Up', value: '+1' },
		],
		default: '+1',
		description: 'Reaction to add',
		displayOptions: {
			show: { resource: [resource], operation: ['addReaction', 'addCommentReaction'] },
		},
	},

	// Issues 2.0: create
	{
		displayName: 'Title',
		name: 'createTitle',
		type: 'string',
		required: true,
		default: '',
		description: 'Title of the new issue',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Body',
		name: 'createBody',
		type: 'string',
		typeOptions: { rows: 5 },
		default: '',
		description: 'Description of the new issue, Markdown supported',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Type',
		name: 'createType',
		type: 'options',
		options: [
			{ name: 'Bug', value: 'bug' },
			{ name: 'Epic', value: 'epic' },
			{ name: 'Story', value: 'story' },
			{ name: 'Task', value: 'task' },
		],
		default: 'task',
		description: 'Type of the new issue',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Labels',
		name: 'createLabels',
		type: 'string',
		default: '',
		placeholder: 'critical, auth',
		description: 'Comma-separated label names',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Assignees',
		name: 'createAssignees',
		type: 'string',
		default: '',
		placeholder: 'alice, bob',
		description: 'Comma-separated logins of the assignees',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Due Date',
		name: 'createDueDate',
		type: 'string',
		default: '',
		placeholder: '2026-12-31T23:59:59Z',
		description: 'Due date of the issue as an RFC 3339 timestamp',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Project ID',
		name: 'createProjectId',
		type: 'number',
		default: 0,
		description: 'Project the new issue is added to, leave 0 to keep it out of every project',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},
	{
		displayName: 'Project Status ID',
		name: 'createProjectStatusId',
		type: 'number',
		default: 0,
		description: 'Column of the project the new issue is placed in',
		displayOptions: { show: { resource: [resource], operation: ['create'] } },
	},

	// Issues 2.0: sub-issues
	{
		displayName: 'Sub-Issue Number',
		name: 'subIssueId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Number of the child issue in the same repository',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['addSubIssue', 'removeSubIssue'],
			},
		},
	},
	{
		displayName: 'Replace Parent',
		name: 'replaceParent',
		type: 'boolean',
		default: false,
		description:
			'Whether to move the child issue away from a different parent. Without it the API answers 422 when the child already has a parent.',
		displayOptions: { show: { resource: [resource], operation: ['addSubIssue'] } },
	},

	// Issues 2.0: development links
	{
		displayName: 'Pull Requests',
		name: 'pulls',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Pull Request',
		default: {},
		description: 'Pull requests to link or unlink',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['linkDevelopment', 'unlinkDevelopment'],
			},
		},
		options: [
			{
				displayName: 'Pull Request',
				name: 'values',
				values: [
					{
						displayName: 'Number',
						name: 'number',
						type: 'number',
						default: 0,
						description: 'Number of the pull request',
					},
					{
						displayName: 'Owner',
						name: 'ownerName',
						type: 'string',
						default: '',
						description:
							'Owner of the repository when the pull request lives in another one, defaults to the current repository',
					},
					{
						displayName: 'Repository',
						name: 'repoName',
						type: 'string',
						default: '',
						description:
							'Repository of the pull request when it lives in another one, defaults to the current repository',
					},
				],
			},
		],
	},
	{
		displayName: 'Branches',
		name: 'branches',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Branch',
		default: {},
		description: 'Branches to link or unlink',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['linkDevelopment', 'unlinkDevelopment'],
			},
		},
		options: [
			{
				displayName: 'Branch',
				name: 'values',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Name of the branch',
					},
					{
						displayName: 'Owner',
						name: 'ownerName',
						type: 'string',
						default: '',
						description:
							'Owner of the repository when the branch lives in another one, defaults to the current repository',
					},
					{
						displayName: 'Repository',
						name: 'repoName',
						type: 'string',
						default: '',
						description:
							'Repository of the branch when it lives in another one, defaults to the current repository',
					},
				],
			},
		],
	},

	// Issues 2.0: bulk
	{
		displayName: 'Issue IDs',
		name: 'issueIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12, 18, 21',
		description: 'Comma-separated numeric IDs of the issues',
		displayOptions: {
			show: { resource: [resource], operation: ['bulkValues', 'bulkDelete'] },
		},
	},
	{
		displayName: 'Exclude Issue IDs',
		name: 'excludeIssueIds',
		type: 'string',
		default: '',
		placeholder: '18',
		description: 'Comma-separated numeric IDs to leave out of the selection',
		displayOptions: {
			show: { resource: [resource], operation: ['bulkValues', 'bulkDelete'] },
		},
	},

	// Attachments
	{
		displayName: 'Binary Property',
		name: 'binaryProperty',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property holding the file to attach',
		displayOptions: {
			show: {
				resource: [resource],
				operation: ['addAttachment', 'addCommentAttachment'],
			},
		},
	},
];
