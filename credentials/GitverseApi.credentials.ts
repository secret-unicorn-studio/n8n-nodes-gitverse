import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

const properties: INodeProperties[] = [
	{
		displayName: 'Base URL',
		name: 'baseUrl',
		type: 'string',
		default: 'https://gitverse.ru',
		description: 'Base URL of your Gitverse/Gitea instance',
		placeholder: 'https://gitverse.ru',
	},
	{
		displayName: 'Personal Access Token',
		name: 'token',
		type: 'string',
		default: '',
		typeOptions: {
			password: true,
		},
		description: 'Personal Access Token with appropriate scopes',
	},
];

export class GitverseApi implements ICredentialType {
	name = 'gitverseApi';
	displayName = 'Gitverse API';
	documentationUrl = 'https://docs.gitea.com/api/latest';
	properties = properties;

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: 'token {{ token }}',
			},
		},
	};
}
