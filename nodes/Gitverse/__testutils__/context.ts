export interface MockApi {
	get: jest.Mock;
	post: jest.Mock;
	put: jest.Mock;
	patch: jest.Mock;
	delete: jest.Mock;
}

export interface ContextOptions {
	params?: Record<string, any>;
	items?: any[];
	continueOnFail?: boolean;
	credentials?: Record<string, any>;
}

export function createApi(): MockApi {
	return {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	};
}

export function createContext({
	params = {},
	items = [{ json: {} }],
	continueOnFail = false,
	credentials = { baseUrl: 'https://api.gitverse.ru', token: 'secret-token' },
}: ContextOptions = {}): any {
	return {
		getInputData: jest.fn(() => items),
		getNodeParameter: jest.fn((name: string, itemIndex: number, fallback?: any) => {
			if (!(name in params)) {
				return fallback;
			}

			const value = params[name];

			return typeof value === 'function' ? value(itemIndex) : value;
		}),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		getNode: jest.fn(() => ({ name: 'Gitverse', type: 'gitverse' })),
		continueOnFail: jest.fn(() => continueOnFail),
	};
}

export function locator(value: string, mode = 'name'): Record<string, unknown> {
	return { __rl: true, value, mode };
}

export const repositoryLocator = locator('SUSTUDIO/n8n-nodes-gitverse');

export function expectNodeOperationError(promise: Promise<unknown>): Promise<void> {
	return expect(promise).rejects.toThrow(/Gitverse|is required|not found/i);
}
