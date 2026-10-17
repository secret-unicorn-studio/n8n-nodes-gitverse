import { NodeConnectionTypes } from 'n8n-workflow';

import { Gitverse } from './Gitverse.node';

jest.mock('./Gitverse.node.execute', () => ({
	execute: jest.fn().mockResolvedValue([{ json: { ok: true } }]),
}));

describe('Gitverse node', () => {
	const node = new Gitverse();
	const desc = node.description;

	const findProperty = (name: string) => desc.properties!.find((p) => p.name === name);
	const findProperties = (name: string) => desc.properties!.filter((p) => p.name === name);

	it('should have correct displayName', () => {
		expect(desc.displayName).toBe('Gitverse');
	});

	it('should have correct name', () => {
		expect(desc.name).toBe('gitverse');
	});

	it('should have version 1', () => {
		expect(desc.version).toBe(1);
	});

	it('should have subtitle expression', () => {
		expect(desc.subtitle).toContain('operation');
		expect(desc.subtitle).toContain('resource');
	});

	it('should describe the node', () => {
		expect(desc.description).toContain('Gitverse');
	});

	it('should have the Gitverse icon', () => {
		expect(desc.icon).toBe('file:gitverse.svg');
	});

	it('should have correct group', () => {
		expect(desc.group).toContain('output');
	});

	it('should have Main input', () => {
		expect(desc.inputs).toEqual([NodeConnectionTypes.Main]);
	});

	it('should have Main output', () => {
		expect(desc.outputs).toEqual([NodeConnectionTypes.Main]);
	});

	it('should require the Gitverse API credentials', () => {
		expect(desc.credentials!.length).toBe(1);
		expect(desc.credentials![0].name).toBe('gitverseApi');
		expect(desc.credentials![0].required).toBe(true);
	});

	it('should have properties array', () => {
		expect(Array.isArray(desc.properties)).toBe(true);
		expect(desc.properties!.length).toBeGreaterThan(20);
	});

	it('should define the documented resources', () => {
		const resourceProp = findProperty('resource') as any;
		const values = resourceProp.options.map((o: any) => o.value);

		expect(values).toEqual(['branch', 'commit', 'file', 'pullRequest', 'repository']);
	});

	it('should scope every operation to a resource', () => {
		const operationProp = findProperty('operation') as any;
		const options = operationProp.options as any[];

		expect(options.length).toBeGreaterThan(15);

		for (const option of options) {
			expect(option.displayOptions?.show?.resource).toBeDefined();
			expect(option.action).toBeDefined();
		}
	});

	it('should expose the repository as a searchable resource locator', () => {
		const repositoryProp = findProperty('repository') as any;

		expect(repositoryProp).toBeDefined();
		expect(repositoryProp.type).toBe('resourceLocator');
		expect(repositoryProp.required).toBe(true);
		expect(repositoryProp.default).toEqual({ mode: 'list', value: '' });

		const modes = repositoryProp.modes.map((m: any) => m.name);
		expect(modes).toEqual(['list', 'url', 'name']);
		expect(repositoryProp.modes[0].typeOptions).toEqual({
			searchListMethod: 'searchRepositories',
			searchable: true,
		});
	});

	it('should expose branches as a resource locator', () => {
		const branchProps = findProperties('branch') as any[];
		const locator = branchProps.find((p) => p.type === 'resourceLocator');

		expect(locator).toBeDefined();
		expect(locator.modes.map((m: any) => m.name)).toEqual(['list', 'name']);
		expect(locator.modes[0].typeOptions).toEqual({
			searchListMethod: 'searchBranches',
			searchable: true,
		});
	});

	it('should offer returnAll and limit on list operations', () => {
		const returnAll = findProperty('returnAll') as any;
		const limit = findProperty('limit') as any;

		expect(returnAll.type).toBe('boolean');
		expect(returnAll.default).toBe(false);
		expect(limit.type).toBe('number');
		expect(limit.typeOptions).toEqual({ minValue: 1 });
		expect(limit.displayOptions.show.returnAll).toEqual([false]);
	});

	it('should have repository creation fields', () => {
		expect(findProperty('name')).toBeDefined();
		expect(findProperty('autoInit')).toBeDefined();
		expect(findProperty('updateFields')).toBeDefined();
	});

	it('should have collaborator fields', () => {
		expect(findProperty('username')).toBeDefined();
		expect(findProperty('permission')).toBeDefined();
	});

	it('should have file fields', () => {
		expect(findProperty('filePath')).toBeDefined();
		expect(findProperty('content')).toBeDefined();
		expect(findProperty('commitMessage')).toBeDefined();
		expect(findProperty('ref')).toBeDefined();
	});

	it('should have commit compare fields', () => {
		expect(findProperty('path')).toBeDefined();
		expect(findProperties('sha').length).toBeGreaterThan(1);
	});

	it('should have pull request fields', () => {
		expect(findProperty('pullRequestNumber')).toBeDefined();
		expect(findProperty('title')).toBeDefined();
		expect(findProperty('head')).toBeDefined();
		expect(findProperty('base')).toBeDefined();
		expect(findProperty('body')).toBeDefined();
		expect(findProperty('state')).toBeDefined();
	});

	it('should register the list search methods', () => {
		expect(node.methods!.listSearch).toBeDefined();
		expect(typeof node.methods!.listSearch!.searchRepositories).toBe('function');
		expect(typeof node.methods!.listSearch!.searchBranches).toBe('function');
	});

	it('should implement an execute method', () => {
		expect(typeof node.execute).toBe('function');
	});

	it('should wrap the operation output in the outer array', async () => {
		const result = await node.execute!.call({} as any);

		expect(result).toEqual([[{ json: { ok: true } }]]);
	});
});
