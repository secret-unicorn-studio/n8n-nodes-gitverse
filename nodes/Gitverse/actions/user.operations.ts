import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRequiredNumber,
	getRequiredString,
	getStringList,
} from '../utils/params';

function readEmails(ctx: IExecuteFunctions, itemIndex: number): string[] {
	return getStringList(ctx, itemIndex, 'emails') ?? [];
}

export async function getUser(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const response = await api.get('/user');

	return response.data;
}

export async function getUserByLogin(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const username = getRequiredString(this, itemIndex, 'username', 'Username is required');

	const response = await api.get(`/users/${encodeURIComponent(username)}`);

	return response.data;
}

export async function getUserById(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const accountId = getRequiredNumber(this, itemIndex, 'accountId', 'Account ID is required');

	const response = await api.get(`/user/${accountId}`);

	return response.data;
}

export async function getUserEmails(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const pagination = getPaginationOptions(this, itemIndex, 50);

	return fetchPages<Record<string, any>>(api, '/user/emails', pagination);
}

export async function addUserEmails(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const emails = readEmails(this, itemIndex);

	const response = await api.post('/user/emails', { emails });

	return response.data ?? { success: true };
}

export async function deleteUserEmails(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const emails = readEmails(this, itemIndex);

	const response = await api.delete('/user/emails', { data: { emails } });

	return response.data ?? { success: true };
}

export async function searchUsers(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const params: Record<string, unknown> = {
		q: getRequiredString(this, itemIndex, 'searchQuery', 'Search query is required'),
	};

	const sort = getOptionalString(this, itemIndex, 'searchSort');
	const order = getOptionalString(this, itemIndex, 'searchOrder');

	if (sort) params.sort = sort;
	if (order) params.order = order;

	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, '/search/users', { ...pagination, params });
}
