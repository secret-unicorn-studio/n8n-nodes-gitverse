import {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeParameterResourceLocator,
	NodeOperationError,
} from 'n8n-workflow';

import { DEFAULT_PER_PAGE } from '../../../utils/api';

export interface RepositoryRef {
	owner: string;
	repo: string;
}

export interface PaginationOptions {
	returnAll: boolean;
	limit: number;
	perPage: number;
}

type ParameterContext = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Read the raw value out of a `resourceLocator` parameter.
 *
 * Locators arrive either as `{ __rl: true, value, mode }` or, in older workflows
 * and in tests, as a plain string.
 */
export function readResourceLocator(value: unknown): string {
	if (value && typeof value === 'object') {
		const locator = value as INodeParameterResourceLocator;

		return typeof locator.value === 'string' ? locator.value : String(locator.value ?? '');
	}

	return typeof value === 'string' ? value : '';
}

/**
 * Split `owner/repo` into its parts, tolerating clone URLs and a `.git` suffix.
 */
export function parseRepositoryValue(
	ctx: ParameterContext,
	value: unknown,
	message: string,
	itemIndex = 0
): RepositoryRef {
	const cleaned = readResourceLocator(value)
		.trim()
		.replace(/\.git$/, '');

	const parts = cleaned.replace(/^https?:\/\/[^/]+\//, '').split('/');

	if (parts.length < 2 || !parts[0] || !parts[1]) {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	}

	return { owner: parts[0], repo: parts[1] };
}

/**
 * Read the shared `repository` locator parameter.
 */
export function getRepositoryRef(
	ctx: ParameterContext,
	itemIndex = 0,
	parameterName = 'repository'
): RepositoryRef {
	const value = ctx.getNodeParameter(parameterName, itemIndex);

	return parseRepositoryValue(
		ctx,
		value,
		'Repository is required in the format "owner/repo"',
		itemIndex
	);
}

/**
 * Read a required string parameter.
 */
export function getRequiredString(
	ctx: ParameterContext,
	itemIndex: number,
	name: string,
	message: string
): string {
	const value = ctx.getNodeParameter(name, itemIndex);

	if (value === undefined || value === null || value === '') {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	}

	return String(value);
}

/**
 * Read a required `resourceLocator` parameter and validate it is not empty.
 */
export function getRequiredLocator(
	ctx: ParameterContext,
	itemIndex: number,
	name: string,
	message: string
): string {
	const value = readResourceLocator(ctx.getNodeParameter(name, itemIndex));

	if (!value) {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	}

	return value;
}

/**
 * Read an optional string parameter, returning the fallback when unset.
 */
export function getOptionalString(
	ctx: ParameterContext,
	itemIndex: number,
	name: string,
	fallback = ''
): string {
	const value = ctx.getNodeParameter(name, itemIndex, fallback);

	return value === undefined || value === null || value === '' ? fallback : String(value);
}

/**
 * Read a `returnAll` / `limit` pair for list operations.
 */
export function getPaginationOptions(
	ctx: IExecuteFunctions,
	itemIndex: number,
	perPage: number = DEFAULT_PER_PAGE
): PaginationOptions {
	const returnAll = ctx.getNodeParameter('returnAll', itemIndex, false) as boolean;
	const limit = returnAll ? 0 : (ctx.getNodeParameter('limit', itemIndex, 50) as number);

	return { returnAll, limit: limit > 0 ? limit : 0, perPage };
}

/**
 * Wrap an API payload into a shape n8n accepts as item JSON.
 */
export function toJsonRecord(data: unknown): IDataObject {
	if (data === undefined || data === null || data === '') {
		return { success: true };
	}

	if (typeof data === 'object') {
		return data as IDataObject;
	}

	return { value: data as string | number | boolean };
}

/**
 * Percent-encode a repository path while keeping the separators intact.
 */
export function encodePath(path: string): string {
	return path
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');
}
