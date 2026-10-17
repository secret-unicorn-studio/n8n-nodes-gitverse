import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import { getPaginationOptions, getRequiredString } from '../../Gitverse/utils/params';
import { settingsBase } from './settings';

function base(ctx: IExecuteFunctions, itemIndex: number): string {
	return settingsBase(ctx, itemIndex, '/actions/secrets');
}

export async function getSecrets(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, base(this, itemIndex), pagination);
}

export async function getSecret(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'secretName', 'Secret name is required');

	const response = await api.get(`${base(this, itemIndex)}/${encodeURIComponent(name)}`);

	return response.data;
}

/**
 * The secret value travels as a query parameter, not in the body.
 */
export async function upsertSecret(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'secretName', 'Secret name is required');
	const value = getRequiredString(this, itemIndex, 'secretValue', 'Secret value is required');

	const response = await api.put(`${base(this, itemIndex)}/${encodeURIComponent(name)}`, null, {
		params: { value },
	});

	return response.data ?? { success: true };
}

export async function deleteSecret(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'secretName', 'Secret name is required');

	const response = await api.delete(`${base(this, itemIndex)}/${encodeURIComponent(name)}`);

	return response.data ?? { success: true };
}
