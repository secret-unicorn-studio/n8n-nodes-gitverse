import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
	getRequiredString,
	getStringList,
} from '../utils/params';

function issuesPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/issues`;
}

function commentPath(owner: string, repo: string, issueNumber: number, commentId: number): string {
	return `${issuesPath(owner, repo)}/${issueNumber}/comments/${commentId}`;
}

export async function getManyIssues(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	const params: Record<string, unknown> = {};
	const state = getOptionalString(this, itemIndex, 'state', 'all');
	const assignee = getOptionalString(this, itemIndex, 'assignee');
	const type = getOptionalString(this, itemIndex, 'issueType');
	const creator = getOptionalString(this, itemIndex, 'creator');
	const labels = getStringList(this, itemIndex, 'labels');
	const sort = getOptionalString(this, itemIndex, 'sort');
	const direction = getOptionalString(this, itemIndex, 'direction');
	const since = getOptionalString(this, itemIndex, 'since');

	// Omitting `state` only returns the open issues, so `all` is always sent.
	params.state = state;
	if (assignee) params.assignee = assignee;
	if (type) params.type = type;
	if (creator) params.creator = creator;
	if (labels) params.labels = labels.join(',');
	if (sort) params.sort = sort;
	if (direction) params.direction = direction;
	if (since) params.since = since;

	return fetchPages<Record<string, any>>(api, issuesPath(owner, repo), {
		...pagination,
		params,
	});
}

export async function getIssue(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.get(`${issuesPath(owner, repo)}/${issueNumber}`);

	return response.data;
}

export async function updateIssue(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	if ('title' in fields) body.title = fields.title;
	if ('body' in fields) body.body = fields.body;
	if ('state' in fields) body.state = fields.state;
	if ('issueType' in fields) body.type = fields.issueType;
	if ('labels' in fields) {
		body.labels = String(fields.labels ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value !== '');
	}
	if ('assignees' in fields) {
		body.assignees = String(fields.assignees ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value !== '');
	}

	const response = await api.patch(`${issuesPath(owner, repo)}/${issueNumber}`, body);

	return response.data;
}

export async function getIssueComments(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const params: Record<string, unknown> = {};
	const since = getOptionalString(this, itemIndex, 'since');
	const before = getOptionalString(this, itemIndex, 'before');

	if (since) params.since = since;
	if (before) params.before = before;

	// The comment listing accepts no pagination, only the time filters.
	const response = await api.get(`${issuesPath(owner, repo)}/${issueNumber}/comments`, {
		params,
	});

	return Array.isArray(response.data) ? response.data : [response.data];
}

export async function getIssueComment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);

	const response = await api.get(`${issuesPath(owner, repo)}/comments/${commentId}`);

	return response.data;
}

export async function createIssueComment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const body: Record<string, unknown> = {
		body: getRequiredString(this, itemIndex, 'comment', 'Comment body is required'),
	};

	const replyTo = this.getNodeParameter('replyTo', itemIndex, 0) as number;
	const threadId = this.getNodeParameter('threadId', itemIndex, 0) as number;

	if (threadId > 0) {
		body.thread_id = threadId;
	} else if (replyTo > 0) {
		body.reply_to = replyTo;
	} else if (this.getNodeParameter('isReview', itemIndex, false) === true) {
		body.is_review = true;
	} else if (this.getNodeParameter('isThread', itemIndex, false) === true) {
		body.is_thread = true;
	}

	const response = await api.post(`${issuesPath(owner, repo)}/${issueNumber}/comments`, body);

	return response.data;
}

export async function updateIssueComment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);

	const response = await api.patch(commentPath(owner, repo, issueNumber, commentId), {
		body: getRequiredString(this, itemIndex, 'comment', 'Comment body is required'),
	});

	return response.data;
}

export async function deleteIssueComment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);

	const response = await api.delete(commentPath(owner, repo, issueNumber, commentId));

	return response.data ?? { success: true };
}

export async function addIssueCommentReaction(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);

	const response = await api.post(
		`${commentPath(owner, repo, issueNumber, commentId)}/reactions`,
		{ content: getRequiredString(this, itemIndex, 'reaction', 'Reaction is required') }
	);

	return response.data;
}

export async function deleteIssueCommentReaction(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);
	const reactionId = getRequiredNumber(
		this,
		itemIndex,
		'reactionId',
		'Reaction ID is required'
	);

	const response = await api.delete(
		`${commentPath(owner, repo, issueNumber, commentId)}/reactions/${reactionId}`
	);

	return response.data ?? { success: true };
}

export async function getIssueTimeline(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const pagination = getPaginationOptions(this, itemIndex);

	const params: Record<string, unknown> = {};
	const since = getOptionalString(this, itemIndex, 'since');
	const before = getOptionalString(this, itemIndex, 'before');

	if (since) params.since = since;
	if (before) params.before = before;

	return fetchPages<Record<string, any>>(
		api,
		`${issuesPath(owner, repo)}/${issueNumber}/timeline`,
		{ ...pagination, params }
	);
}

export async function addIssueCommentAttachment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);
	const propertyName = getOptionalString(this, itemIndex, 'binaryProperty', 'data');

	const binary = this.helpers.assertBinaryData(itemIndex, propertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);

	// The endpoint only accepts multipart/form-data with a single `attachment` part.
	const form = new (globalThis as any).FormData();
	const Blob = (globalThis as any).Blob;
	const part = binary.mimeType ? new Blob([buffer], { type: binary.mimeType }) : new Blob([buffer]);

	form.append('attachment', part, binary.fileName ?? `attachment-${commentId}`);

	const response = await api.post(
		`${issuesPath(owner, repo)}/comments/${commentId}/attachments`,
		form
	);

	return response.data ?? { success: true };
}

export async function deleteIssueCommentAttachment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const commentId = getRequiredNumber(
		this,
		itemIndex,
		'commentId',
		'Comment ID is required'
	);
	const attachmentId = getRequiredNumber(
		this,
		itemIndex,
		'attachmentId',
		'Attachment ID is required'
	);

	const response = await api.delete(
		`${issuesPath(owner, repo)}/comments/${commentId}/attachments/${attachmentId}`
	);

	return response.data ?? { success: true };
}
