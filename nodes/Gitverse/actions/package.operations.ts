import { IExecuteFunctions } from 'n8n-workflow';
import { AxiosInstance } from 'axios';

import { getRequiredNumber, getRequiredString } from '../utils/params';

interface PackageScope {
	ownerType: 'organization' | 'user';
	owner: string;
	type: string;
	name: string;
}

/**
 * Packages live under `/users/{username}/...` or `/orgs/{org}/...`; the owner type
 * parameter selects one of the two shapes.
 */
function readScope(ctx: IExecuteFunctions, itemIndex: number): PackageScope {
	const ownerType = ctx.getNodeParameter('ownerType', itemIndex, 'user') as string;
	const isOrganization = ownerType === 'organization';

	return {
		ownerType: isOrganization ? 'organization' : 'user',
		owner: getRequiredString(
			ctx,
			itemIndex,
			isOrganization ? 'organization' : 'username',
			isOrganization ? 'Organization is required' : 'Username is required'
		),
		type: getRequiredString(ctx, itemIndex, 'packageType', 'Package type is required'),
		name: getRequiredString(ctx, itemIndex, 'packageName', 'Package name is required'),
	};
}

function packagePath(scope: PackageScope): string {
	const prefix = scope.ownerType === 'organization' ? '/orgs' : '/users';

	return `${prefix}/${encodeURIComponent(scope.owner)}/packages/${encodeURIComponent(
		scope.type
	)}/${encodeURIComponent(scope.name)}`;
}

export async function getPackageVersions(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const scope = readScope(this, itemIndex);

	const response = await api.get(`${packagePath(scope)}/versions`);

	return response.data;
}

export async function deletePackageVersion(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const scope = readScope(this, itemIndex);
	const versionId = getRequiredNumber(
		this,
		itemIndex,
		'versionId',
		'Package version ID is required'
	);

	const response = await api.delete(`${packagePath(scope)}/versions/${versionId}`);

	return response.data ?? { success: true };
}

export async function deletePackage(
	this: IExecuteFunctions,
	api: AxiosInstance,
	itemIndex: number
): Promise<Record<string, any>> {
	const scope = readScope(this, itemIndex);

	const response = await api.delete(packagePath(scope));

	return response.data ?? { success: true };
}
