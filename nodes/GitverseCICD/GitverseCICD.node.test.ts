import { NodeConnectionTypes } from 'n8n-workflow';

import { GitverseCICD } from './GitverseCICD.node';
import { gitverseCicdNodeProperties } from './GitverseCICD.node.properties';
import { execute, operations } from './GitverseCICD.node.execute';
import { createApiClient } from '../../utils/api';
import { createApi, createContext, repositoryLocator } from '../Gitverse/__testutils__/context';

jest.mock('../../utils/api', () => {
	const actual = jest.requireActual('../../utils/api');

	return { ...actual, createApiClient: jest.fn() };
});

const mockCreateApiClient = createApiClient as jest.Mock;

function findProperty(name: string): any {
	return gitverseCicdNodeProperties.find((property: any) => property.name === name);
}

describe('GitverseCICD node', () => {
	const node = new GitverseCICD();
	const desc = node.description;

	describe('description', () => {
		it('should have correct displayName and name', () => {
			expect(desc.displayName).toBe('Gitverse CI/CD');
			expect(desc.name).toBe('gitverseCicd');
		});

		it('should use the Gitverse icon', () => {
			expect(desc.icon).toBe('file:gitverse.svg');
		});

		it('should have a subtitle expression', () => {
			expect(desc.subtitle).toContain('$parameter');
		});

		it('should have Main input and output', () => {
			expect(desc.inputs).toEqual([NodeConnectionTypes.Main]);
			expect(desc.outputs).toEqual([NodeConnectionTypes.Main]);
		});

		it('should require the Gitverse API credentials', () => {
			expect(desc.credentials![0].name).toBe('gitverseApi');
			expect(desc.credentials![0].required).toBe(true);
		});

		it('should register the repository list search', () => {
			expect(Object.keys((node as any).methods.listSearch)).toContain('searchRepositories');
		});

		it('should define the documented resources', () => {
			const resourceProp = findProperty('resource');
			const values = resourceProp.options.map((option: any) => option.value);

			expect(values).toEqual([
				'artifact',
				'job',
				'run',
				'runner',
				'secret',
				'variable',
				'workflow',
			]);
		});

		it('should scope every operation to a resource', () => {
			const operationProp = findProperty('operation');

			for (const option of operationProp.options) {
				expect(option.displayOptions?.show?.resource).toBeDefined();
				expect(option.action).toBeDefined();
			}
		});

		it('should expose the workflow operations', () => {
			const values = findProperty('operation')
				.options.filter((option: any) => option.displayOptions.show.resource.includes('workflow'))
				.map((option: any) => option.value)
				.sort();

			expect(values).toEqual(['dispatch', 'get', 'getAll', 'getDispatches', 'getRuns']);
		});

		it('should expose the run, job and artifact operations', () => {
			const valuesFor = (resource: string) =>
				findProperty('operation')
					.options.filter((option: any) =>
						option.displayOptions.show.resource.includes(resource)
					)
					.map((option: any) => option.value)
					.sort();

			expect(valuesFor('run')).toEqual([
				'cancel',
				'get',
				'getAll',
				'getByIndex',
				'getJobs',
				'getJobsByIndex',
				'rerun',
			]);
			expect(valuesFor('job')).toEqual(['get', 'getLogs', 'rerun']);
			expect(valuesFor('artifact')).toEqual(['delete', 'download', 'get', 'getAll']);
		});

		it('should expose the settings operations', () => {
			const valuesFor = (resource: string) =>
				findProperty('operation')
					.options.filter((option: any) =>
						option.displayOptions.show.resource.includes(resource)
					)
					.map((option: any) => option.value)
					.sort();

			expect(valuesFor('variable')).toEqual(['create', 'delete', 'get', 'getAll', 'update']);
			expect(valuesFor('secret')).toEqual(['delete', 'get', 'getAll', 'upsert']);
			expect(valuesFor('runner')).toEqual([
				'createRegistrationToken',
				'delete',
				'get',
				'getAll',
			]);
		});

		it('should only show the repository picker in the repository scope', () => {
			const repositoryProp = findProperty('repository');

			expect(repositoryProp.type).toBe('resourceLocator');
			expect(repositoryProp.displayOptions.show.scope).toEqual(['repository']);
		});

		it('should show the organization field in the organization scope', () => {
			const organizationProp = findProperty('organization');

			expect(organizationProp.displayOptions.show.scope).toEqual(['organization']);
		});
	});

	describe('execute', () => {
		let api: ReturnType<typeof createApi>;

		beforeEach(() => {
			api = createApi();
			mockCreateApiClient.mockReturnValue(api);
		});

		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should run the selected operation', async () => {
			api.get.mockResolvedValue({ data: [{ id: 1 }] });
			const ctx = createContext({
				params: { resource: 'workflow', operation: 'getAll', repository: repositoryLocator },
			});

			const result = await execute.call(ctx);

			expect(result).toHaveLength(1);
			expect(result[0].json).toEqual({ id: 1 });
		});

		it('should reject an unknown resource', async () => {
			const ctx = createContext({ params: { resource: 'nope', operation: 'get' } });

			await expect(execute.call(ctx)).rejects.toThrow('Unknown resource: nope');
		});

		it('should reject an unknown operation', async () => {
			const ctx = createContext({
				params: { resource: 'workflow', operation: 'nope' },
			});

			await expect(execute.call(ctx)).rejects.toThrow(
				'Unknown operation: nope for resource workflow'
			);
		});

		it('should collect the error when continueOnFail is set', async () => {
			api.get.mockRejectedValue(new Error('boom'));
			const ctx = createContext({
				params: {
					resource: 'workflow',
					operation: 'getAll',
					repository: repositoryLocator,
				},
				continueOnFail: true,
			});

			const result = await execute.call(ctx);

			expect(result[0].json).toEqual({ error: 'boom' });
		});

		it('should expose an operation for every resource', () => {
			expect(Object.keys(operations).sort()).toEqual([
				'artifact',
				'job',
				'run',
				'runner',
				'secret',
				'variable',
				'workflow',
			]);
		});

		it('should rethrow the error by default', async () => {
			api.get.mockRejectedValue(new Error('boom'));
			const ctx = createContext({
				params: {
					resource: 'workflow',
					operation: 'getAll',
					repository: repositoryLocator,
				},
			});

			await expect(execute.call(ctx)).rejects.toThrow('boom');
		});
	});

	describe('node.execute', () => {
		let api: ReturnType<typeof createApi>;

		beforeEach(() => {
			api = createApi();
			mockCreateApiClient.mockReturnValue(api);
		});

		it('should wrap the items in an array of runs', async () => {
			api.get.mockResolvedValue({ data: [{ id: 1 }] });
			const ctx = createContext({
				params: { resource: 'workflow', operation: 'getAll', repository: repositoryLocator },
			});

			const result = await node.execute.call(ctx);

			expect(result).toHaveLength(1);
			expect(result[0][0].json).toEqual({ id: 1 });
		});
	});
});
