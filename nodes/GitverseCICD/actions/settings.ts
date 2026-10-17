import { IExecuteFunctions } from 'n8n-workflow';

import { getRepositoryRef, getRequiredString } from '../../Gitverse/utils/params';

/**
 * Path shared by the settings resources (variables, secrets, runners), which exist
 * both for a repository and for an organization.
 */
export function settingsBase(
	ctx: IExecuteFunctions,
	itemIndex: number,
	suffix: string
): string {
	const scope = ctx.getNodeParameter('scope', itemIndex, 'repository') as string;

	if (scope === 'organization') {
		const org = getRequiredString(ctx, itemIndex, 'organization', 'Organization is required');

		return `/orgs/${encodeURIComponent(org)}${suffix}`;
	}

	const { owner, repo } = getRepositoryRef(ctx, itemIndex);

	return `/repos/${owner}/${repo}${suffix}`;
}
