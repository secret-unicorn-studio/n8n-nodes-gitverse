import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import { getPaginationOptions, getRequiredNumber } from '../../Gitverse/utils/params';
import { settingsBase } from './settings';

function base(ctx: IExecuteFunctions, itemIndex: number): string {
	return settingsBase(ctx, itemIndex, '/actions/runners');
}

export async function getRunners(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, base(this, itemIndex), pagination);
}

export async function createRunnerRegistrationToken(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const response = await api.post(`${base(this, itemIndex)}/registration-token`);

	return response.data ?? { success: true };
}

export async function getRunner(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const runnerId = getRequiredNumber(this, itemIndex, 'runnerId', 'Runner ID is required');

	const response = await api.get(`${base(this, itemIndex)}/${runnerId}`);

	return response.data;
}

export async function deleteRunner(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const runnerId = getRequiredNumber(this, itemIndex, 'runnerId', 'Runner ID is required');

	const response = await api.delete(`${base(this, itemIndex)}/${runnerId}`);

	return response.data ?? { success: true };
}
