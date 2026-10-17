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
		name: 'Create Comment',
		value: 'createComment',
		description: 'Add a comment to an issue',
		action: 'Create an issue comment',
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
		name: 'Get',
		value: 'get',
		description: 'Get an issue',
		action: 'Get an issue',
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
		name: 'Get Many',
		value: 'getAll',
		description: 'List issues of a repository',
		action: 'Get many issues',
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
			show: { resource: [resource], operation: ['deleteCommentAttachment'] },
		},
	},
	...paginationProperties(scope(['getAll', 'getTimeline'])),

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
			show: { resource: [resource], operation: ['addCommentReaction'] },
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
			show: { resource: [resource], operation: ['addCommentAttachment'] },
		},
	},
];
