import { Gitverse } from './Gitverse.node';
import { NodeConnectionTypes } from 'n8n-workflow';

describe('Gitverse node', () => {
	const node = new Gitverse();
	const desc = node.description;

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

	it('should have description', () => {
		expect(desc.description).toContain('Gitverse');
		expect(desc.description).toContain('Gitea');
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

	it('should require gitverseApi credentials', () => {
		expect(desc.credentials).toBeDefined();
		expect(desc.credentials!.length).toBe(1);
		expect(desc.credentials![0].name).toBe('gitverseApi');
		expect(desc.credentials![0].required).toBe(true);
	});

	it('should have properties array', () => {
		expect(desc.properties).toBeDefined();
		expect(Array.isArray(desc.properties)).toBe(true);
		expect(desc.properties!.length).toBeGreaterThan(10);
	});

	it('should define all 5 resources', () => {
		const resourceProp = desc.properties!.find((p) => p.name === 'resource');
		expect(resourceProp).toBeDefined();
		const options = (resourceProp as any).options as any[];
		const values = options.map((o) => o.value);
		expect(values).toContain('repository');
		expect(values).toContain('branch');
		expect(values).toContain('file');
		expect(values).toContain('pullRequest');
		expect(values).toContain('commit');
	});

	it('should have operation options', () => {
		const operationProp = desc.properties!.find((p) => p.name === 'operation');
		expect(operationProp).toBeDefined();
		const options = (operationProp as any).options as any[];
		expect(options.length).toBeGreaterThan(10);
	});

	it('should have owner and repo fields', () => {
		const ownerProp = desc.properties!.find((p) => p.name === 'owner');
		expect(ownerProp).toBeDefined();
		expect((ownerProp as any).required).toBe(true);

		const repoProp = desc.properties!.find((p) => p.name === 'repo');
		expect(repoProp).toBeDefined();
		expect((repoProp as any).required).toBe(true);
	});

	it('should have filters for list operations', () => {
		const filtersProp = desc.properties!.find((p) => p.name === 'filters');
		expect(filtersProp).toBeDefined();
	});

	it('should have file-related fields', () => {
		const filePathProp = desc.properties!.find((p) => p.name === 'filePath');
		expect(filePathProp).toBeDefined();

		const contentProp = desc.properties!.find((p) => p.name === 'content');
		expect(contentProp).toBeDefined();

		const commitMsgProp = desc.properties!.find((p) => p.name === 'commitMessage');
		expect(commitMsgProp).toBeDefined();
	});

	it('should have PR-related fields', () => {
		const prIndexProp = desc.properties!.find((p) => p.name === 'prIndex');
		expect(prIndexProp).toBeDefined();

		const headProp = desc.properties!.find((p) => p.name === 'head');
		expect(headProp).toBeDefined();

		const titleProp = desc.properties!.find((p) => p.name === 'title');
		expect(titleProp).toBeDefined();
	});

	it('should implement an execute method', () => {
		expect(typeof node.execute).toBe('function');
	});
});
