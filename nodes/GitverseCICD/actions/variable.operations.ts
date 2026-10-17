import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import { getPaginationOptions, getRequiredString } from '../../Gitverse/utils/params';
import { settingsBase } from './settings';

function base(ctx: IExecuteFunctions, itemIndex: number): string {
	return settingsBase(ctx, itemIndex, '/actions/variables');
}

export async function getVariables(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, base(this, itemIndex), pagination);
}

export async function createVariable(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const response = await api.post(base(this, itemIndex), {
		name: getRequiredString(this, itemIndex, 'variableName', 'Variable name is required'),
		value: getRequiredString(this, itemIndex, 'variableValue', 'Variable value is required'),
	});

	return response.data ?? { success: true };
}

export async function getVariable(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'variableName', 'Variable name is required');

	const response = await api.get(`${base(this, itemIndex)}/${encodeURIComponent(name)}`);

	return response.data;
}

export async function updateVariable(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'variableName', 'Variable name is required');

	const response = await api.patch(`${base(this, itemIndex)}/${encodeURIComponent(name)}`, {
		name: getRequiredString(this, itemIndex, 'variableName', 'Variable name is required'),
		value: getRequiredString(this, itemIndex, 'variableValue', 'Variable value is required'),
	});

	return response.data ?? { success: true };
}

export async function deleteVariable(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const name = getRequiredString(this, itemIndex, 'variableName', 'Variable name is required');

	const response = await api.delete(`${base(this, itemIndex)}/${encodeURIComponent(name)}`);

	return response.data ?? { success: true };
}
