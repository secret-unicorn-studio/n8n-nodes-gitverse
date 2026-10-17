import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	getPaginationOptions,
	getRepositoryRef,
	getRequiredNumber,
} from '../../Gitverse/utils/params';

function artifactsPath(owner: string, repo: string): string {
	return `/repos/${owner}/${repo}/actions/artifacts`;
}

export async function getArtifacts(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, artifactsPath(owner, repo), pagination);
}

export async function getArtifact(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const artifactId = getRequiredNumber(
		this,
		itemIndex,
		'artifactId',
		'Artifact ID is required'
	);

	const response = await api.get(`${artifactsPath(owner, repo)}/${artifactId}`);

	return response.data;
}

export async function deleteArtifact(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const artifactId = getRequiredNumber(
		this,
		itemIndex,
		'artifactId',
		'Artifact ID is required'
	);

	const response = await api.delete(`${artifactsPath(owner, repo)}/${artifactId}`);

	return response.data ?? { success: true };
}

/**
 * The endpoint answers with a redirect to the archive rather than with the file
 * itself, so the download URL is reported instead of the binary.
 */
export async function getArtifactDownloadUrl(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const artifactId = getRequiredNumber(
		this,
		itemIndex,
		'artifactId',
		'Artifact ID is required'
	);

	const response = await api.get(`${artifactsPath(owner, repo)}/${artifactId}/zip`, {
		disableFollowRedirect: true,
	});

	const location = (response.headers ?? {})['location'];

	if (location) {
		return { download_url: String(location), status: response.status };
	}

	return response.data ?? { success: true };
}
