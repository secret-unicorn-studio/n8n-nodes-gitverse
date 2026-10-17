import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import {
	getOptionalString,
	getRepositoryRef,
	getRequiredNumber,
	getRequiredString,
} from '../utils/params';

function projectsPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/projects`;
}

/**
 * The API expects the colour of a column in the `#RRGGBB` form, while the n8n
 * colour picker hands it over without the hash.
 */
function normalizeColor(color: string): string {
	const trimmed = color.trim();

	if (!trimmed) {
		return '';
	}

	return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export async function getManyProjects(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const response = await api.get(projectsPath(owner, repo));

	return response.data;
}

export async function getProject(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');

	const response = await api.get(`${projectsPath(owner, repo)}/${projectId}`);

	return response.data;
}

export async function createProject(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		title: getRequiredString(this, itemIndex, 'projectTitle', 'Project title is required'),
	};

	const description = getOptionalString(this, itemIndex, 'projectDescription');

	if (description) body.description = description;

	if (this.getNodeParameter('projectPrivate', itemIndex, false) === true) {
		body.private = true;
	}

	const templateType = this.getNodeParameter('templateType', itemIndex, 0) as number;

	if (templateType > 0) body.template_type = templateType;

	const response = await api.post(projectsPath(owner, repo), body);

	return response.data;
}

export async function updateProject(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const body: Record<string, unknown> = {};

	if ('title' in fields) body.title = fields.title;
	if ('description' in fields) body.description = fields.description;
	if ('private' in fields) body.private = fields.private;
	if ('state' in fields) body.state = fields.state;

	const response = await api.patch(`${projectsPath(owner, repo)}/${projectId}`, body);

	return response.data;
}

export async function deleteProject(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');

	const response = await api.delete(`${projectsPath(owner, repo)}/${projectId}`);

	return response.data ?? { success: true };
}

export async function createProjectColumn(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');

	const body: Record<string, unknown> = {
		title: getRequiredString(this, itemIndex, 'columnTitle', 'Column title is required'),
	};

	const color = normalizeColor(getOptionalString(this, itemIndex, 'columnColor'));

	if (color) body.color = color;

	const response = await api.post(`${projectsPath(owner, repo)}/${projectId}/columns`, body);

	return response.data;
}

export async function updateProjectColumn(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');
	const columnId = getRequiredNumber(this, itemIndex, 'columnId', 'Column ID is required');
	const fields = this.getNodeParameter('columnFields', itemIndex, {}) as Record<string, unknown>;

	const body: Record<string, unknown> = {};

	if ('title' in fields) body.title = fields.title;
	if ('color' in fields) body.color = normalizeColor(String(fields.color ?? ''));
	if ('default' in fields) body.default = fields.default;
	if ('sorting' in fields) body.sorting = fields.sorting;

	const response = await api.patch(
		`${projectsPath(owner, repo)}/${projectId}/columns/${columnId}`,
		body
	);

	return response.data;
}

export async function deleteProjectColumn(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const projectId = getRequiredNumber(this, itemIndex, 'projectId', 'Project ID is required');
	const columnId = getRequiredNumber(this, itemIndex, 'columnId', 'Column ID is required');

	const response = await api.delete(
		`${projectsPath(owner, repo)}/${projectId}/columns/${columnId}`
	);

	return response.data ?? { success: true };
}
