import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	encodePath,
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
	getRequiredString,
} from '../utils/params';

function releasesPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/releases`;
}

function toRecord(fields: Record<string, unknown>): Record<string, unknown> {
	const body: Record<string, unknown> = {};

	if ('tagName' in fields) body.tag_name = fields.tagName;
	if ('name' in fields) body.name = fields.name;
	if ('targetCommitish' in fields) body.target_commitish = fields.targetCommitish;
	if ('body' in fields) body.body = fields.body;
	if ('draft' in fields) body.draft = fields.draft;
	if ('prerelease' in fields) body.prerelease = fields.prerelease;
	if ('isAuthorizedOnly' in fields) body.is_authorized_only = fields.isAuthorizedOnly;

	return body;
}

export async function getManyReleases(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, releasesPath(owner, repo), pagination);
}

export async function getRelease(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);

	const response = await api.get(`${releasesPath(owner, repo)}/${releaseId}`);

	return response.data;
}

export async function getReleaseByTag(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const tag = getRequiredString(this, itemIndex, 'releaseTag', 'Tag is required');

	const response = await api.get(`${releasesPath(owner, repo)}/tags/${encodePath(tag)}`);

	return response.data;
}

export async function createRelease(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);

	const body: Record<string, unknown> = {
		tag_name: getRequiredString(this, itemIndex, 'tagName', 'Tag name is required'),
		name: getOptionalString(this, itemIndex, 'releaseName'),
		target_commitish: getOptionalString(this, itemIndex, 'targetCommitish'),
		body: getOptionalString(this, itemIndex, 'releaseBody'),
	};

	if (this.getNodeParameter('draft', itemIndex, false) === true) {
		body.draft = true;
	}
	if (this.getNodeParameter('prerelease', itemIndex, false) === true) {
		body.prerelease = true;
	}
	if (this.getNodeParameter('isAuthorizedOnly', itemIndex, false) === true) {
		body.is_authorized_only = true;
	}

	const response = await api.post(releasesPath(owner, repo), body);

	return response.data;
}

export async function updateRelease(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);
	const fields = this.getNodeParameter('updateFields', itemIndex, {}) as Record<
		string,
		unknown
	>;

	const response = await api.patch(
		`${releasesPath(owner, repo)}/${releaseId}`,
		toRecord(fields)
	);

	return response.data;
}

export async function deleteRelease(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);

	const response = await api.delete(`${releasesPath(owner, repo)}/${releaseId}`);

	return response.data ?? { success: true };
}

export async function deleteReleaseByTag(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const tag = getRequiredString(this, itemIndex, 'releaseTag', 'Tag is required');

	const response = await api.delete(`${releasesPath(owner, repo)}/tags/${encodePath(tag)}`);

	return response.data ?? { success: true };
}

export async function getReleaseAssets(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${releasesPath(owner, repo)}/${releaseId}/assets`,
		pagination
	);
}

export async function uploadReleaseAsset(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);
	const propertyName = getOptionalString(this, itemIndex, 'binaryProperty', 'data');

	const binary = this.helpers.assertBinaryData(itemIndex, propertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, propertyName);
	const fileName = binary.fileName ?? '';
	const assetName = getOptionalString(this, itemIndex, 'assetName') || fileName;

	if (!assetName) {
		throw new NodeOperationError(
			this.getNode(),
			'Asset name is required: set Asset Name or upload a file with a name',
			{ itemIndex }
		);
	}

	// The endpoint takes multipart/form-data with the file name and the file itself.
	const form = new (globalThis as any).FormData();
	const Blob = (globalThis as any).Blob;
	const part = binary.mimeType ? new Blob([buffer], { type: binary.mimeType }) : new Blob([buffer]);

	form.append('name', assetName);
	form.append('attachment', part, fileName || assetName);

	const response = await api.post(
		`${releasesPath(owner, repo)}/${releaseId}/assets`,
		form
	);

	return response.data;
}

export async function deleteReleaseAsset(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const releaseId = getRequiredNumber(
		this,
		itemIndex,
		'releaseId',
		'Release ID is required'
	);
	const assetId = getRequiredNumber(
		this,
		itemIndex,
		'assetId',
		'Asset ID is required'
	);

	const response = await api.delete(
		`${releasesPath(owner, repo)}/${releaseId}/assets/${assetId}`
	);

	return response.data ?? { success: true };
}
