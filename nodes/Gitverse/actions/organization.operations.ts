import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { fetchPages } from '../../../utils/api';
import {
	getOptionalString,
	getPaginationOptions,
	getRepositoryRef,
	getRequiredString,
	getStringList,
} from '../utils/params';

function orgPath(org: string): string {
	return `/orgs/${encodeURIComponent(org)}`;
}

function readOrganization(ctx: IExecuteFunctions, itemIndex: number): string {
	return getRequiredString(ctx, itemIndex, 'organization', 'Organization is required');
}

export async function getOrgTeams(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const organization = readOrganization(this, itemIndex);
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(api, `${orgPath(organization)}/teams`, pagination);
}

export async function createOrgTeam(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const organization = readOrganization(this, itemIndex);

	const body: Record<string, unknown> = {
		name: getRequiredString(this, itemIndex, 'teamName', 'Team name is required'),
	};

	const description = getOptionalString(this, itemIndex, 'teamDescription');

	if (description) body.description = description;

	const privacy = getOptionalString(this, itemIndex, 'teamPrivacy');

	if (privacy) body.privacy = privacy;

	const notificationSetting = getOptionalString(this, itemIndex, 'notificationSetting');

	if (notificationSetting) body.notification_setting = notificationSetting;

	const permission = getOptionalString(this, itemIndex, 'teamPermission');

	if (permission) body.permission = permission;

	if (this.getNodeParameter('canCreateOrgRepo', itemIndex, false) === true) {
		body.can_create_org_repo = true;
	}

	const maintainers = getStringList(this, itemIndex, 'maintainers');

	if (maintainers) body.maintainers = maintainers;

	const repoNames = getStringList(this, itemIndex, 'repoNames');

	if (repoNames) body.repo_names = repoNames;

	const response = await api.post(`${orgPath(organization)}/teams`, body);

	return response.data;
}

export async function getTeamMembers(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const organization = readOrganization(this, itemIndex);
	const team = getRequiredString(this, itemIndex, 'team', 'Team is required');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${orgPath(organization)}/teams/${encodeURIComponent(team)}/members`,
		pagination
	);
}

export async function getOrgMember(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const organization = readOrganization(this, itemIndex);
	const username = getRequiredString(this, itemIndex, 'username', 'Username is required');

	const response = await api.get(
		`${orgPath(organization)}/members/${encodeURIComponent(username)}`
	);

	return response.data ?? { success: true };
}

export async function getTeamRepos(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const organization = readOrganization(this, itemIndex);
	const team = getRequiredString(this, itemIndex, 'team', 'Team is required');
	const pagination = getPaginationOptions(this, itemIndex);

	return fetchPages<Record<string, any>>(
		api,
		`${orgPath(organization)}/teams/${encodeURIComponent(team)}/repos`,
		pagination
	);
}

export async function setTeamRepo(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const organization = readOrganization(this, itemIndex);
	const team = getRequiredString(this, itemIndex, 'team', 'Team is required');
	const { owner, repo } = getRepositoryRef(this, itemIndex);
	const permission = getOptionalString(this, itemIndex, 'permission', 'read');

	const response = await api.put(
		`${orgPath(organization)}/teams/${encodeURIComponent(team)}/repos/${owner}/${repo}`,
		{ permission }
	);

	return response.data ?? { success: true };
}

export async function getOrgIssueTypes(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>[]> {
	const organization = readOrganization(this, itemIndex);

	const response = await api.get(`${orgPath(organization)}/issue-types`);

	return response.data;
}
