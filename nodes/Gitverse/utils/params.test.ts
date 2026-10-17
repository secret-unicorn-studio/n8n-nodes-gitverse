import {
	readResourceLocator,
	parseRepositoryValue,
	getRepositoryRef,
	getRequiredString,
	getRequiredLocator,
	getOptionalString,
	getPaginationOptions,
	toJsonRecord,
	encodePath,
} from './params';
import { createContext, locator } from '../__testutils__/context';

describe('utils/params', () => {
	describe('readResourceLocator', () => {
		it('should read the value of a locator object', () => {
			expect(readResourceLocator(locator('owner/repo'))).toBe('owner/repo');
		});

		it('should coerce non-string locator values', () => {
			expect(readResourceLocator({ __rl: true, value: 42, mode: 'list' })).toBe('42');
		});

		it('should return an empty string when the locator has no value', () => {
			expect(readResourceLocator({ __rl: true, mode: 'list' })).toBe('');
		});

		it('should accept plain strings', () => {
			expect(readResourceLocator('owner/repo')).toBe('owner/repo');
		});

		it('should return an empty string for unsupported values', () => {
			expect(readResourceLocator(42)).toBe('');
			expect(readResourceLocator(undefined)).toBe('');
			expect(readResourceLocator(null)).toBe('');
		});
	});

	describe('parseRepositoryValue', () => {
		it('should split owner and repo', () => {
			const ctx = createContext();

			expect(parseRepositoryValue(ctx, 'SUSTUDIO/n8n', 'required')).toEqual({
				owner: 'SUSTUDIO',
				repo: 'n8n',
			});
		});

		it('should strip a .git suffix', () => {
			const ctx = createContext();

			expect(parseRepositoryValue(ctx, 'SUSTUDIO/n8n.git', 'required')).toEqual({
				owner: 'SUSTUDIO',
				repo: 'n8n',
			});
		});

		it('should strip a clone URL prefix', () => {
			const ctx = createContext();

			expect(
				parseRepositoryValue(ctx, 'https://gitverse.ru/SUSTUDIO/n8n.git', 'required')
			).toEqual({ owner: 'SUSTUDIO', repo: 'n8n' });
		});

		it('should read locator objects', () => {
			const ctx = createContext();

			expect(parseRepositoryValue(ctx, locator('SUSTUDIO/n8n'), 'required')).toEqual({
				owner: 'SUSTUDIO',
				repo: 'n8n',
			});
		});

		it('should ignore extra path segments', () => {
			const ctx = createContext();

			expect(parseRepositoryValue(ctx, 'owner/repo/tree/main', 'required')).toEqual({
				owner: 'owner',
				repo: 'repo',
			});
		});

		it('should throw when the owner is missing', () => {
			const ctx = createContext();

			expect(() => parseRepositoryValue(ctx, '/repo', 'Repository is required')).toThrow(
				'Repository is required'
			);
		});

		it('should throw when the repo is missing', () => {
			const ctx = createContext();

			expect(() => parseRepositoryValue(ctx, 'owner/', 'Repository is required')).toThrow(
				'Repository is required'
			);
		});

		it('should throw when the value is empty', () => {
			const ctx = createContext();

			expect(() => parseRepositoryValue(ctx, '', 'Repository is required')).toThrow(
				'Repository is required'
			);
		});
	});

	describe('getRepositoryRef', () => {
		it('should read the repository parameter', () => {
			const ctx = createContext({ params: { repository: locator('SUSTUDIO/n8n') } });

			expect(getRepositoryRef(ctx)).toEqual({ owner: 'SUSTUDIO', repo: 'n8n' });
			expect(ctx.getNodeParameter).toHaveBeenCalledWith('repository', 0);
		});

		it('should read a custom parameter name and index', () => {
			const ctx = createContext({ params: { target: 'owner/repo' } });

			expect(getRepositoryRef(ctx, 3, 'target')).toEqual({ owner: 'owner', repo: 'repo' });
			expect(ctx.getNodeParameter).toHaveBeenCalledWith('target', 3);
		});

		it('should throw when the parameter is empty', () => {
			const ctx = createContext({ params: { repository: '' } });

			expect(() => getRepositoryRef(ctx)).toThrow('Repository is required');
		});
	});

	describe('getRequiredString', () => {
		it('should return the value', () => {
			const ctx = createContext({ params: { name: 'value' } });

			expect(getRequiredString(ctx, 0, 'name', 'Name is required')).toBe('value');
		});

		it('should coerce numbers to strings', () => {
			const ctx = createContext({ params: { name: 7 } });

			expect(getRequiredString(ctx, 0, 'name', 'Name is required')).toBe('7');
		});

		it('should throw for undefined', () => {
			const ctx = createContext({ params: { name: undefined } });

			expect(() => getRequiredString(ctx, 0, 'name', 'Name is required')).toThrow(
				'Name is required'
			);
		});

		it('should throw for null', () => {
			const ctx = createContext({ params: { name: null } });

			expect(() => getRequiredString(ctx, 0, 'name', 'Name is required')).toThrow(
				'Name is required'
			);
		});

		it('should throw for an empty string', () => {
			const ctx = createContext({ params: { name: '' } });

			expect(() => getRequiredString(ctx, 0, 'name', 'Name is required')).toThrow(
				'Name is required'
			);
		});
	});

	describe('getRequiredLocator', () => {
		it('should return the locator value', () => {
			const ctx = createContext({ params: { branch: locator('feature') } });

			expect(getRequiredLocator(ctx, 0, 'branch', 'Branch is required')).toBe('feature');
		});

		it('should throw for an empty locator', () => {
			const ctx = createContext({ params: { branch: locator('') } });

			expect(() => getRequiredLocator(ctx, 0, 'branch', 'Branch is required')).toThrow(
				'Branch is required'
			);
		});
	});

	describe('getOptionalString', () => {
		it('should return the value', () => {
			const ctx = createContext({ params: { value: 'set' } });

			expect(getOptionalString(ctx, 0, 'value')).toBe('set');
		});

		it('should return the fallback when unset', () => {
			const ctx = createContext();

			expect(getOptionalString(ctx, 0, 'value', 'fallback')).toBe('fallback');
		});

		it('should return the fallback for empty strings', () => {
			const ctx = createContext({ params: { value: '' } });

			expect(getOptionalString(ctx, 0, 'value', 'fallback')).toBe('fallback');
		});

		it('should return the fallback for null values', () => {
			const ctx = createContext({ params: { value: null } });

			expect(getOptionalString(ctx, 0, 'value', 'fallback')).toBe('fallback');
		});

		it('should stringify numbers', () => {
			const ctx = createContext({ params: { value: 5 } });

			expect(getOptionalString(ctx, 0, 'value', 'fallback')).toBe('5');
		});
	});

	describe('getPaginationOptions', () => {
		it('should read limit when returnAll is false', () => {
			const ctx = createContext({ params: { returnAll: false, limit: 10 } });

			expect(getPaginationOptions(ctx)).toEqual({
				returnAll: false,
				limit: 10,
				perPage: 50,
			});
		});

		it('should default the limit to 50', () => {
			const ctx = createContext({ params: { returnAll: false } });

			expect(getPaginationOptions(ctx).limit).toBe(50);
		});

		it('should ignore non-positive limits', () => {
			const ctx = createContext({ params: { returnAll: false, limit: 0 } });

			expect(getPaginationOptions(ctx).limit).toBe(0);
		});

		it('should drop the limit when returnAll is set', () => {
			const ctx = createContext({ params: { returnAll: true, limit: 10 } });

			expect(getPaginationOptions(ctx, 0, 25)).toEqual({
				returnAll: true,
				limit: 0,
				perPage: 25,
			});
		});

		it('should default returnAll to false', () => {
			const ctx = createContext();

			expect(getPaginationOptions(ctx).returnAll).toBe(false);
		});
	});

	describe('toJsonRecord', () => {
		it('should pass objects through', () => {
			const data = { id: 1 };

			expect(toJsonRecord(data)).toBe(data);
		});

		it('should report success for empty payloads', () => {
			expect(toJsonRecord(undefined)).toEqual({ success: true });
			expect(toJsonRecord(null)).toEqual({ success: true });
			expect(toJsonRecord('')).toEqual({ success: true });
		});

		it('should wrap primitives', () => {
			expect(toJsonRecord('done')).toEqual({ value: 'done' });
			expect(toJsonRecord(42)).toEqual({ value: 42 });
		});
	});

	describe('encodePath', () => {
		it('should keep separators', () => {
			expect(encodePath('docs/release notes.md')).toBe('docs/release%20notes.md');
		});

		it('should encode special characters', () => {
			expect(encodePath('a&b/c#d.md')).toBe('a%26b/c%23d.md');
		});

		it('should return an empty string for empty input', () => {
			expect(encodePath('')).toBe('');
		});
	});
});
