import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { encodeContent } from '../../../utils/api';
import {
	encodePath,
	getOptionalString,
	getRepositoryRef,
	getRequiredString,
} from '../utils/params';

export async function getFile(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any> | Record<string, any>[]> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const filePath = (this.getNodeParameter('filePath', itemIndex, '') as string) || '';
	const ref = getOptionalString(this, itemIndex, 'ref');
	const query = ref ? { ref } : {};

	const response = await api.get(
		`/repos/${owner}/${repo}/contents/${encodePath(filePath)}`,
		{ params: query }
	);

	return response.data;
}

export async function createOrUpdateFile(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const filePath = getRequiredString(
		this,
		itemIndex,
		'filePath',
		'File path is required'
	);
	const content = this.getNodeParameter('content', itemIndex, '') as string;

	if (!content) {
		throw new NodeOperationError(this.getNode(), 'File content is required', {
			itemIndex,
		});
	}

	const body: Record<string, string> = {
		message: getOptionalString(this, itemIndex, 'commitMessage', 'Update file via n8n'),
		content: encodeContent(content, true),
	};

	const branch = getOptionalString(this, itemIndex, 'branch');
	const sha = getOptionalString(this, itemIndex, 'sha');

	if (branch) {
		body.branch = branch;
	}

	if (sha) {
		body.sha = sha;
	}

	const response = await api.put(
		`/repos/${owner}/${repo}/contents/${encodePath(filePath)}`,
		body
	);

	return response.data;
}

export async function deleteFile(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const filePath = getRequiredString(
		this,
		itemIndex,
		'filePath',
		'File path is required'
	);
	const sha = getRequiredString(
		this,
		itemIndex,
		'sha',
		'SHA of the file being deleted is required'
	);

	const body: Record<string, string> = {
		message: getOptionalString(this, itemIndex, 'commitMessage', 'Delete file via n8n'),
		sha,
	};

	const branch = getOptionalString(this, itemIndex, 'branch');

	if (branch) {
		body.branch = branch;
	}

	const response = await api.delete(
		`/repos/${owner}/${repo}/contents/${encodePath(filePath)}`,
		{ data: body }
	);

	return response.data ?? { success: true };
}
