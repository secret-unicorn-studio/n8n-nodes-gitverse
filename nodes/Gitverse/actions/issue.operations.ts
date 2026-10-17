import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { buildMultipartBody, fetchPages } from '../../../utils/api';
import {
	getNumberList,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	// `project_id: null` moves the issue back to the project backlog.
	if ('removeFromProject' in fields && fields.removeFromProject === true) {
		body.project_id = null;
	} else if ('projectId' in fields && Number(fields.projectId) > 0) {
		body.project_id = Number(fields.projectId);
	}
	if ('projectStatusId' in fields && Number(fields.projectStatusId) > 0) {
		body.project_status_id = Number(fields.projectStatusId);
	}

	const response = await api.patch(`${issuesPath(owner, repo)}/${issueNumber}`, body);

	return response.data;
}

export async function getIssueComments(
	this: IExecuteFunctions,
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	api: GitverseClient,
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
	const { body, contentType } = buildMultipartBody([
		{
			name: 'attachment',
			value: buffer,
			fileName: binary.fileName ?? `attachment-${commentId}`,
			contentType: binary.mimeType,
		},
	]);

	const response = await api.post(
		`${issuesPath(owner, repo)}/comments/${commentId}/attachments`,
		body,
		{ headers: { 'Content-Type': contentType } }
	);

	return response.data ?? { success: true };
}

export async function deleteIssueCommentAttachment(
	this: IExecuteFunctions,
	api: GitverseClient,
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

/* ------------------------------------------------------------------ */
/* Issues 2.0: creation, labels, attachments, sub-issues, development */
/* ------------------------------------------------------------------ */

export async function createIssue(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		title: getRequiredString(this, itemIndex, 'createTitle', 'Issue title is required'),
	};

	const issueBody = getOptionalString(this, itemIndex, 'createBody');

	if (issueBody) body.body = issueBody;

	const type = getOptionalString(this, itemIndex, 'createType');

	if (type) body.type = type;

	const labels = getStringList(this, itemIndex, 'createLabels');

	if (labels) body.labels = labels;

	const assignees = getStringList(this, itemIndex, 'createAssignees');

	if (assignees) body.assignees = assignees;

	const dueDate = getOptionalString(this, itemIndex, 'createDueDate');

	if (dueDate) body.due_date = dueDate;

	const projectId = this.getNodeParameter('createProjectId', itemIndex, 0) as number;

	if (projectId > 0) body.project_id = projectId;

	const projectStatusId = this.getNodeParameter('createProjectStatusId', itemIndex, 0) as number;

	if (projectStatusId > 0) body.project_status_id = projectStatusId;

	const response = await api.post(issuesPath(owner, repo), body);

	return response.data;
}

export async function getIssueLabels(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.get(`${issuesPath(owner, repo)}/${issueNumber}/labels`);

	return response.data;
}

export async function addIssueAttachment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const propertyName = getOptionalString(this, itemIndex, 'binaryProperty', 'data');

	const binary = this.helpers.assertBinaryData(itemIndex, propertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);

	// The endpoint takes the same multipart payload as the comment attachments.
	const { body, contentType } = buildMultipartBody([
		{
			name: 'attachment',
			value: buffer,
			fileName: binary.fileName ?? `attachment-${issueNumber}`,
			contentType: binary.mimeType,
		},
	]);

	const response = await api.post(
		`${issuesPath(owner, repo)}/${issueNumber}/attachments`,
		body,
		{ headers: { 'Content-Type': contentType } }
	);

	return response.data;
}

export async function deleteIssueAttachment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const attachmentId = getRequiredNumber(
		this,
		itemIndex,
		'attachmentId',
		'Attachment ID is required'
	);

	const response = await api.delete(
		`${issuesPath(owner, repo)}/${issueNumber}/attachments/${attachmentId}`
	);

	return response.data ?? { success: true };
}

export async function getIssueParent(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.get(`${issuesPath(owner, repo)}/${issueNumber}/parent`);

	return response.data;
}

export async function getSubIssues(
	this: IExecuteFunctions,
	api: GitverseClient,
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

	return fetchPages<Record<string, any>>(
		api,
		`${issuesPath(owner, repo)}/${issueNumber}/sub_issues`,
		pagination
	);
}

export async function addSubIssue(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const subIssueId = getRequiredNumber(
		this,
		itemIndex,
		'subIssueId',
		'Sub-issue number is required'
	);

	const body: Record<string, unknown> = { sub_issue_id: subIssueId };

	if (this.getNodeParameter('replaceParent', itemIndex, false) === true) {
		body.replace_parent = true;
	}

	const response = await api.post(
		`${issuesPath(owner, repo)}/${issueNumber}/sub_issues`,
		body
	);

	return response.data;
}

export async function removeSubIssue(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const subIssueId = getRequiredNumber(
		this,
		itemIndex,
		'subIssueId',
		'Sub-issue number is required'
	);

	const response = await api.delete(`${issuesPath(owner, repo)}/${issueNumber}/sub_issues`, {
		params: { sub_issue_id: subIssueId },
	});

	return response.data ?? { success: true };
}

/**
 * Read the `pulls` and `branches` collections into the shape the development
 * endpoint expects.
 */
function readDevelopmentLinks(
	ctx: IExecuteFunctions,
	itemIndex: number
): Record<string, unknown> {
	const readValues = (name: string): any[] => {
		const value = ctx.getNodeParameter(name, itemIndex, {}) as { values?: any[] };

		return Array.isArray(value?.values) ? value.values : [];
	};

	const withRepository = (
		entry: Record<string, unknown>,
		source: Record<string, unknown>
	): Record<string, unknown> => {
		if (source.ownerName) entry.owner_name = source.ownerName;
		if (source.repoName) entry.repo_name = source.repoName;

		return entry;
	};

	return {
		pulls: readValues('pulls').map((pull) =>
			withRepository({ number: Number(pull.number) }, pull)
		),
		branches: readValues('branches').map((branch) =>
			withRepository({ name: String(branch.name ?? '') }, branch)
		),
	};
}

export async function getIssueDevelopment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.get(`${issuesPath(owner, repo)}/${issueNumber}/development`);

	return response.data;
}

export async function linkIssueDevelopment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.post(
		`${issuesPath(owner, repo)}/${issueNumber}/development`,
		readDevelopmentLinks(this, itemIndex)
	);

	return response.data;
}

export async function unlinkIssueDevelopment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);

	const response = await api.delete(
		`${issuesPath(owner, repo)}/${issueNumber}/development`,
		{ data: readDevelopmentLinks(this, itemIndex) }
	);

	return response.data ?? { success: true };
}

export async function addIssueReaction(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueNumber = getRequiredNumber(
		this,
		itemIndex,
		'issueNumber',
		'Issue number is required'
	);
	const content = getRequiredString(this, itemIndex, 'reaction', 'Reaction is required');

	const response = await api.post(`${issuesPath(owner, repo)}/${issueNumber}/reactions`, {
		content,
	});

	return response.data;
}

/**
 * Read the numeric issue IDs of the bulk operations.
 */
function readIssueIds(
	ctx: IExecuteFunctions,
	itemIndex: number,
	name: string
): number[] | undefined {
	return getNumberList(ctx, itemIndex, name);
}

export async function getIssueBulkValues(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueIds = readIssueIds(this, itemIndex, 'issueIds') ?? [];

	if (issueIds.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Issue IDs are required', { itemIndex });
	}

	const data: Record<string, unknown> = { issue_ids: issueIds };
	const excluded = readIssueIds(this, itemIndex, 'excludeIssueIds');

	if (excluded) data.exclude_issue_ids = excluded;

	const response = await api.post(`${issuesPath(owner, repo)}/bulk/values`, { data });

	return response.data;
}

export async function bulkDeleteIssues(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const issueIds = readIssueIds(this, itemIndex, 'issueIds') ?? [];

	if (issueIds.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Issue IDs are required', { itemIndex });
	}

	const body: Record<string, unknown> = { data: issueIds };
	const excluded = readIssueIds(this, itemIndex, 'excludeIssueIds');

	if (excluded) body.exclude_issue_ids = excluded;

	const response = await api.delete(`${issuesPath(owner, repo)}/bulk/delete`, { data: body });

	return response.data ?? { success: true };
}
