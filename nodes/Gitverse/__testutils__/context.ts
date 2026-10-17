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
	binary?: Record<string, { data: Buffer; fileName?: string; mimeType?: string }>;
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
	binary = {},
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
		helpers: {
			assertBinaryData: jest.fn((_itemIndex: number, propertyName: string) => {
				const entry = binary[propertyName];

				if (!entry) {
					throw new Error(`No binary data property "${propertyName}"`);
				}

				return { data: entry.data.toString('base64'), fileName: entry.fileName, mimeType: entry.mimeType };
			}),
			getBinaryDataBuffer: jest.fn(async (_itemIndex: number, propertyName: string) => {
				const entry = binary[propertyName];

				if (!entry) {
					throw new Error(`No binary data property "${propertyName}"`);
				}

				return entry.data;
			}),
		},
	};
}

export function locator(value: string, mode = 'name'): Record<string, unknown> {
	return { __rl: true, value, mode };
}

export const repositoryLocator = locator('SUSTUDIO/n8n-nodes-gitverse');

export function expectNodeOperationError(promise: Promise<unknown>): Promise<void> {
	return expect(promise).rejects.toThrow(/Gitverse|is required|not found/i);
}
