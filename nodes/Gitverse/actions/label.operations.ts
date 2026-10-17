import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	encodePath,
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
} from '../utils/params';

/** The API expects the hex colour without the leading `#`. */
function normalizeColor(color: string): string {
	return color.startsWith('#') ? color.slice(1) : color;
}

export async function getManyLabels(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);
	const sort = getOptionalString(this, itemIndex, 'sort');

	// Label listings take `limit` instead of `per_page`.
	return fetchPages<Record<string, any>>(api, `/repos/${owner}/${repo}/labels`, {
		...pagination,
		perPageParam: 'limit',
		params: sort ? { sort } : {},
	});
}

export async function getLabel(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const label = getRequiredString(this, itemIndex, 'label', 'Label name is required');

	const response = await api.get(`/repos/${owner}/${repo}/labels/${encodePath(label)}`);

	return response.data;
}

export async function createLabel(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		name: getRequiredString(this, itemIndex, 'label', 'Label name is required'),
		color: normalizeColor(getOptionalString(this, itemIndex, 'color', 'ededed')),
		description: getOptionalString(this, itemIndex, 'labelDescription'),
	};

	if (this.getNodeParameter('exclusive', itemIndex, false) === true) {
		body.exclusive = true;
	}

	const response = await api.post(`/repos/${owner}/${repo}/labels`, body);

	return response.data;
}

export async function updateLabel(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const label = getRequiredString(this, itemIndex, 'label', 'Label name is required');
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	// Contrary to the documentation the API renames through `name`, not `new_name`.
	if ('name' in fields) body.name = fields.name;
	if ('color' in fields) body.color = normalizeColor(String(fields.color ?? ''));
	if ('labelDescription' in fields) body.description = fields.labelDescription;
	if ('exclusive' in fields) body.exclusive = fields.exclusive;

	const response = await api.patch(
		`/repos/${owner}/${repo}/labels/${encodePath(label)}`,
		body
	);

	return response.data;
}
