import type { Config } from 'jest';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	rootDir: '.',
	testMatch: ['**/*.test.ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	coverageDirectory: '<rootDir>/coverage',
	coverageThreshold: {
		global: {
			branches: 85,
			functions: 95,
			lines: 90,
			statements: 90,
		},
	},
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/__testutils__/'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				diagnostics: false,
			},
		],
	},
};

export default config;
