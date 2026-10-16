import { GitverseApi } from './GitverseApi.credentials';

describe('GitverseApi credentials', () => {
	const creds = new GitverseApi();

	it('should have correct name', () => {
		expect(creds.name).toBe('gitverseApi');
	});

	it('should have correct displayName', () => {
		expect(creds.displayName).toBe('Gitverse API');
	});

	it('should have documentationUrl', () => {
		expect(creds.documentationUrl).toBe('https://docs.gitea.com/api/latest');
	});

	it('should have properties array', () => {
		expect(Array.isArray(creds.properties)).toBe(true);
		expect(creds.properties.length).toBe(2);
	});

	it('should have baseUrl property', () => {
		const baseUrlProp = creds.properties.find((p) => p.name === 'baseUrl');
		expect(baseUrlProp).toBeDefined();
		expect(baseUrlProp?.displayName).toBe('Base URL');
		expect(baseUrlProp?.type).toBe('string');
		expect(baseUrlProp?.default).toBe('https://gitverse.ru');
		expect(baseUrlProp?.placeholder).toBe('https://gitverse.ru');
	});

	it('should have token property', () => {
		const tokenProp = creds.properties.find((p) => p.name === 'token');
		expect(tokenProp).toBeDefined();
		expect(tokenProp?.displayName).toBe('Personal Access Token');
		expect(tokenProp?.type).toBe('string');
		expect(tokenProp?.default).toBe('');
		expect(tokenProp?.typeOptions?.password).toBe(true);
	});

	it('should have authenticate method', () => {
		expect(creds.authenticate).toBeDefined();
		expect(creds.authenticate?.type).toBe('generic');
	});

	it('should generate correct authorization header', () => {
		const properties = creds.authenticate?.properties as any;
		expect(properties?.headers?.Authorization).toBe(
			'token {{ token }}'
		);
	});
});
