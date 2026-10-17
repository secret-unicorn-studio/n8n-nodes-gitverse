import { GitverseApi } from './GitverseApi.credentials';
import { GITVERSE_ACCEPT_HEADER } from '../utils/api';

describe('GitverseApi credentials', () => {
	const creds = new GitverseApi();

	it('should have correct name', () => {
		expect(creds.name).toBe('gitverseApi');
	});

	it('should have correct displayName', () => {
		expect(creds.displayName).toBe('Gitverse API');
	});

	it('should point at the Gitverse API documentation', () => {
		expect(creds.documentationUrl).toBe(
			'https://gitverse.ru/docs/developers/public-api'
		);
	});

	it('should have properties array', () => {
		expect(Array.isArray(creds.properties)).toBe(true);
		expect(creds.properties.length).toBe(3);
	});

	it('should default to the API host', () => {
		const baseUrlProp = creds.properties.find((p) => p.name === 'baseUrl');
		expect(baseUrlProp).toBeDefined();
		expect(baseUrlProp?.displayName).toBe('Base URL');
		expect(baseUrlProp?.type).toBe('string');
		expect(baseUrlProp?.default).toBe('https://api.gitverse.ru');
		expect(baseUrlProp?.placeholder).toBe('https://api.gitverse.ru');
	});

	it('should have token property', () => {
		const tokenProp = creds.properties.find((p) => p.name === 'token');
		expect(tokenProp).toBeDefined();
		expect(tokenProp?.displayName).toBe('Personal Access Token');
		expect(tokenProp?.type).toBe('string');
		expect(tokenProp?.default).toBe('');
		expect(tokenProp?.typeOptions?.password).toBe(true);
	});

	it('should expose a retry budget', () => {
		const retriesProp = creds.properties.find((p) => p.name === 'maxRetries');
		expect(retriesProp).toBeDefined();
		expect(retriesProp?.type).toBe('number');
		expect(retriesProp?.default).toBe(3);
	});

	it('should have authenticate method', () => {
		expect(creds.authenticate).toBeDefined();
		expect(creds.authenticate?.type).toBe('generic');
	});

	it('should generate the Bearer authorization header', () => {
		const properties = creds.authenticate?.properties as any;
		expect(properties?.headers?.Authorization).toBe('Bearer {{ token }}');
	});

	it('should request the versioned media type', () => {
		const properties = creds.authenticate?.properties as any;
		expect(properties?.headers?.Accept).toBe(GITVERSE_ACCEPT_HEADER);
	});

	it('should verify credentials against the current user endpoint', () => {
		expect(creds.test?.request).toEqual(
			expect.objectContaining({
				baseURL: '={{ $credentials.baseUrl }}',
				url: '/user',
				method: 'GET',
				headers: { Accept: GITVERSE_ACCEPT_HEADER },
			})
		);
	});
});
