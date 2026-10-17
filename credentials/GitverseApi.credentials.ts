import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { GITVERSE_ACCEPT_HEADER } from '../utils/api';

const properties: INodeProperties[] = [
	{
		displayName: 'Base URL',
		name: 'baseUrl',
		type: 'string',
		default: 'https://api.gitverse.ru',
		description:
			'Base URL of the Gitverse API. Use https://api.gitverse.ru for the public service; self-hosted instances usually need their own path prefix (for example https://git.example.com/api/v1).',
		placeholder: 'https://api.gitverse.ru',
	},
	{
		displayName: 'Personal Access Token',
		name: 'token',
		type: 'string',
		default: '',
		typeOptions: {
			password: true,
		},
		description: 'Personal Access Token with the scopes your workflows need',
	},
	{
		displayName: 'Max Retries',
		name: 'maxRetries',
		type: 'number',
		default: 3,
		description:
			'How many times to retry a request rejected with 429 or a server error. Set to 0 to disable retries.',
	},
];

export class GitverseApi implements ICredentialType {
	name = 'gitverseApi';
	displayName = 'Gitverse API';
	documentationUrl = 'https://gitverse.ru/docs/developers/public-api';
	properties = properties;

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: 'Bearer {{ token }}',
				Accept: GITVERSE_ACCEPT_HEADER,
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/user',
			method: 'GET',
			headers: {
				Accept: GITVERSE_ACCEPT_HEADER,
			},
		},
	};
}
