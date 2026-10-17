import { IExecuteFunctions } from 'n8n-workflow';
import axios, { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getNumberList,
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
	getRequiredString,
	getStringList,
} from '../utils/params';

function pullRequestPath(owner: string, repo: string, number: number): string {
	return `/repos/${owner}/${repo}/pulls/${number}`;
}

export async function getPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);

	const response = await api.get(pullRequestPath(owner, repo, number));

	return response.data;
}

export async function getManyPullRequests(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	const params: Record<string, unknown> = {
		state: getOptionalString(this, itemIndex, 'state', 'open'),
	};

	const head = getOptionalString(this, itemIndex, 'head');
	const base = getOptionalString(this, itemIndex, 'base');
	const sort = getOptionalString(this, itemIndex, 'sort');
	const direction = getOptionalString(this, itemIndex, 'direction');

	if (head) params.head = head;
	if (base) params.base = base;
	if (sort) params.sort = sort;
	if (direction) params.direction = direction;

	return fetchPages<Record<string, any>>(api, `/repos/${owner}/${repo}/pulls`, {
		...pagination,
		params,
	});
}

export async function createPullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		title: getRequiredString(this, itemIndex, 'title', 'Title is required'),
		head: getRequiredString(this, itemIndex, 'head', 'Head branch is required'),
		base: getRequiredString(this, itemIndex, 'base', 'Base branch is required'),
		body: getOptionalString(this, itemIndex, 'body'),
	};

	const headRepo = getOptionalString(this, itemIndex, 'headRepo');
	const assignees = getStringList(this, itemIndex, 'assignees');
	const labels = getNumberList(this, itemIndex, 'labels');
	const milestone = this.getNodeParameter('milestone', itemIndex, 0) as number;

	if (headRepo) body.head_repo = headRepo;
	if (assignees) body.assignees = assignees;
	if (labels) body.labels = labels;
	if (milestone > 0) body.milestone = milestone;
	if (this.getNodeParameter('draft', itemIndex, false) === true) {
		body.draft = true;
	}

	const response = await api.post(`/repos/${owner}/${repo}/pulls`, body);

	return response.data;
}

export async function updatePullRequest(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	if ('title' in fields) body.title = fields.title;
	if ('body' in fields) body.body = fields.body;
	if ('state' in fields) body.state = fields.state;
	if ('base' in fields) body.base = fields.base;
	if ('maintainerCanModify' in fields) {
		body.maintainer_can_modify = fields.maintainerCanModify;
	}
	if ('assignees' in fields) {
		body.assignees = String(fields.assignees ?? '')
			.split(',')
			.map((value) => value.trim())
			.filter((value) => value !== '');
	}

	const response = await api.patch(pullRequestPath(owner, repo, number), body);

	return response.data;
}

export async function updatePullRequestBranch(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const expectedHeadSha = getOptionalString(this, itemIndex, 'expectedHeadSha');

	const response = await api.put(`${pullRequestPath(owner, repo, number)}/update-branch`, {
		expected_head_sha: expectedHeadSha || undefined,
	});

	return response.data ?? { success: true };
}

export async function getPullRequestMergeStatus(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);

	try {
		await api.get(`${pullRequestPath(owner, repo, number)}/merge`);

		return { mergeable: true };
	} catch (error) {
		// The endpoint answers 204 when the pull request can be merged and 404 when it cannot.
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			return { mergeable: false };
		}

		throw error;
	}
}

export async function getPullRequestFiles(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${pullRequestPath(owner, repo, number)}/files`,
		pagination
	);
}

export async function getPullRequestCommits(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${pullRequestPath(owner, repo, number)}/commits`,
		pagination
	);
}

export async function createPullRequestComment(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);

	const body: Record<string, unknown> = {
		body: getRequiredString(this, itemIndex, 'comment', 'Comment body is required'),
	};

	const commitId = getOptionalString(this, itemIndex, 'commitId');
	const path = getOptionalString(this, itemIndex, 'filePath');
	const line = this.getNodeParameter('line', itemIndex, 0) as number;
	const side = getOptionalString(this, itemIndex, 'side');
	const inReplyTo = this.getNodeParameter('inReplyTo', itemIndex, 0) as number;

	if (commitId) body.commit_id = commitId;
	if (path) body.path = path;
	if (line > 0) body.line = line;
	if (side) body.side = side;
	if (inReplyTo > 0) body.in_reply_to = inReplyTo;

	const response = await api.post(`${pullRequestPath(owner, repo, number)}/comments`, body);

	return response.data;
}

export async function getPullRequestReviews(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const pagination = getPaginationOptions(this, itemIndex);

	// Review listings take `limit` instead of `per_page` and reject `sort`.
	return fetchPages<Record<string, any>>(
		api,
		`${pullRequestPath(owner, repo, number)}/reviews`,
		{ ...pagination, perPageParam: 'limit' }
	);
}

export async function createPullRequestReview(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);

	const body: Record<string, unknown> = {
		event: getOptionalString(this, itemIndex, 'event', 'PENDING'),
		body: getOptionalString(this, itemIndex, 'reviewBody'),
	};

	const commitId = getOptionalString(this, itemIndex, 'commitId');
	const comments = this.getNodeParameter('reviewComments', itemIndex, {}) as {
		comment?: Array<Record<string, unknown>>;
	};

	if (commitId) body.commit_id = commitId;

	const commentValues = comments.comment ?? [];

	if (commentValues.length > 0) {
		body.comments = commentValues.map((comment) => {
			const entry: Record<string, unknown> = {
				path: comment.path,
				body: comment.body,
			};

			if (Number(comment.position) > 0) entry.new_position = Number(comment.position);
			if (Number(comment.oldPosition) > 0) entry.old_position = Number(comment.oldPosition);

			return entry;
		});
	}

	const response = await api.post(`${pullRequestPath(owner, repo, number)}/reviews`, body);

	return response.data;
}

export async function submitPullRequestReview(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const reviewId = getRequiredNumber(
		this,
		itemIndex,
		'reviewId',
		'Review ID is required'
	);

	const event = getRequiredString(
		this,
		itemIndex,
		'event',
		'Review event is required (COMMENT, APPROVED, REQUEST_CHANGES or REQUEST_REVIEW)'
	);

	const response = await api.post(
		`${pullRequestPath(owner, repo, number)}/reviews/${reviewId}/events`,
		{
			event,
			body: getOptionalString(this, itemIndex, 'reviewBody'),
		}
	);

	return response.data ?? { success: true };
}

export async function deletePullRequestReview(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const number = getRequiredNumber(
		this,
		itemIndex,
		'pullRequestNumber',
		'Pull request number is required'
	);
	const reviewId = getRequiredNumber(
		this,
		itemIndex,
		'reviewId',
		'Review ID is required'
	);

	const response = await api.delete(
		`${pullRequestPath(owner, repo, number)}/reviews/${reviewId}`
	);

	return response.data ?? { success: true };
}
