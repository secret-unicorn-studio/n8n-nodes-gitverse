import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
	getRequiredString,
} from '../utils/params';

/**
 * Events the Gitverse webhook API accepts. `*` is not a valid value on the API
 * side, so the trigger treats it as "any event" on its own.
 */
export const HOOK_EVENTS = [
	'create',
	'delete',
	'fork',
	'push',
	'pull_request',
	'pull_request_review',
	'pull_request_comment',
];

function hooksPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/hooks`;
}

/**
 * Normalise a multi-select value, which n8n hands over as an array, while still
 * tolerating a comma-separated string.
 */
function toStringList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map(String);
	}

	if (value === undefined || value === null || value === '') {
		return [];
	}

	return String(value)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

function readEvents(ctx: IExecuteFunctions, itemIndex: number): string[] {
	return toStringList(ctx.getNodeParameter('events', itemIndex, ['push']));
}

function buildConfig(fields: Record<string, unknown>): Record<string, unknown> {
	const config: Record<string, unknown> = {};

	if ('url' in fields) config.url = fields.url;
	if ('contentType' in fields) config.content_type = fields.contentType;
	if ('httpMethod' in fields) config.http_method = fields.httpMethod;
	// The API accepts the two empty defaults, but there is no point in sending them.
	if ('authorizationHeader' in fields && fields.authorizationHeader) {
		config.authorization_header = fields.authorizationHeader;
	}
	if ('branchFilter' in fields && fields.branchFilter) {
		config.branch_filter = fields.branchFilter;
	}

	return config;
}

export async function getManyHooks(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, hooksPath(owner, repo), pagination);
}

export async function getHook(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const hookId = getRequiredNumber(this, itemIndex, 'hookId', 'Hook ID is required');

	const response = await api.get(`${hooksPath(owner, repo)}/${hookId}`);

	return response.data;
}

export async function createHook(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		active: this.getNodeParameter('active', itemIndex, true) === true,
		events: readEvents(this, itemIndex),
		config: buildConfig({
			url: getRequiredString(this, itemIndex, 'url', 'Payload URL is required'),
			contentType: this.getNodeParameter('contentType', itemIndex, 'json'),
			httpMethod: this.getNodeParameter('httpMethod', itemIndex, 'POST'),
			authorizationHeader: this.getNodeParameter('authorizationHeader', itemIndex, ''),
			branchFilter: this.getNodeParameter('branchFilter', itemIndex, ''),
		}),
	};

	const response = await api.post(hooksPath(owner, repo), body);

	return response.data;
}

export async function updateHook(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const hookId = getRequiredNumber(this, itemIndex, 'hookId', 'Hook ID is required');
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	if ('active' in fields) body.active = fields.active;
	if ('events' in fields) body.events = toStringList(fields.events);
	if ('addEvents' in fields) body.add_events = toStringList(fields.addEvents);
	if ('removeEvents' in fields) body.remove_events = toStringList(fields.removeEvents);
	if (
		'url' in fields ||
		'contentType' in fields ||
		'httpMethod' in fields ||
		'authorizationHeader' in fields ||
		'branchFilter' in fields
	) {
		body.config = buildConfig(fields);
	}

	const response = await api.patch(`${hooksPath(owner, repo)}/${hookId}`, body);

	return response.data;
}

export async function deleteHook(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const hookId = getRequiredNumber(this, itemIndex, 'hookId', 'Hook ID is required');

	const response = await api.delete(`${hooksPath(owner, repo)}/${hookId}`);

	return response.data ?? { success: true };
}
