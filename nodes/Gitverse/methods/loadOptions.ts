import {
	ILoadOptionsFunctions,
	INodeListSearchResult,
} from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { createApiClient, fetchPages, GitverseApiOptions } from '../../../utils/api';
import { getRepositoryRef } from '../utils/params';

async function getApiClient(ctx: ILoadOptionsFunctions): Promise<GitverseClient> {
	const credentials = await ctx.getCredentials<GitverseApiOptions>('gitverseApi');

	return createApiClient(ctx, {
		baseUrl: credentials.baseUrl,
		token: credentials.token,
		retries: credentials.retries,
	});
}

function matches(value: string, filter?: string): boolean {
	return !filter || value.toLowerCase().includes(filter.toLowerCase());
}

export const listSearch = {
	/**
	 * Repositories the token owner can access. Gitverse exposes no repository
	 * search endpoint, so the list is filtered on the client.
	 */
	async searchRepositories(
		this: ILoadOptionsFunctions,
		filter?: string
	): Promise<INodeListSearchResult> {
		const api = await getApiClient(this);
		const repositories = await fetchPages<Record<string, any>>(api, '/user/repos', {
			perPage: 100,
		});

		return {
			results: repositories
				.map((repository) => String(repository.full_name ?? repository.name ?? ''))
				.filter((fullName) => fullName !== '' && matches(fullName, filter))
				.map((fullName) => ({ name: fullName, value: fullName })),
		};
	},

	/**
	 * Branches of the currently selected repository.
	 */
	async searchBranches(
		this: ILoadOptionsFunctions,
		filter?: string
	): Promise<INodeListSearchResult> {
		let owner: string;
		let repo: string;

		try {
			({ owner, repo } = getRepositoryRef(this));
		} catch {
			return { results: [] };
		}

		const api = await getApiClient(this);
		const branches = await fetchPages<Record<string, any>>(
			api,
			`/repos/${owner}/${repo}/branches`,
			{ perPage: 100 }
		);

		return {
			results: branches
				.map((branch) => String(branch.name ?? ''))
				.filter((name) => name !== '' && matches(name, filter))
				.map((name) => ({ name, value: name })),
		};
	},
};
