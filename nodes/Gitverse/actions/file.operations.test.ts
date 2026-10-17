import * as file from './file.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('file operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getFile', () => {
		it('should GET a file by path', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, filePath: 'docs/readme.md' },
			});
			api.get.mockResolvedValue({ data: { path: 'docs/readme.md' } });

			const result = await file.getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/contents/docs/readme.md`, {
				params: {},
			});
			expect(result).toEqual({ path: 'docs/readme.md' });
		});

		it('should pass the reference as a query parameter', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'readme.md',
					ref: 'develop',
				},
			});
			api.get.mockResolvedValue({ data: {} });

			await file.getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/contents/readme.md`, {
				params: { ref: 'develop' },
			});
		});

		it('should request the repository root with a trailing slash', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: [] });

			await file.getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/contents/`, { params: {} });
		});

		it('should encode path segments', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, filePath: 'notes/my file.md' },
			});
			api.get.mockResolvedValue({ data: {} });

			await file.getFile.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/contents/notes/my%20file.md`, {
				params: {},
			});
		});
	});

	describe('createOrUpdateFile', () => {
		it('should PUT a base64 encoded file', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'readme.md',
					content: 'hello',
					commitMessage: 'docs: update readme',
					branch: 'feature/docs',
					sha: 'abc123',
				},
			});
			api.put.mockResolvedValue({ data: { content: {} } });

			await file.createOrUpdateFile.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/contents/readme.md`, {
				message: 'docs: update readme',
				content: Buffer.from('hello').toString('base64'),
				branch: 'feature/docs',
				sha: 'abc123',
			});
		});

		it('should omit the branch and sha when unset', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'readme.md',
					content: 'hello',
				},
			});
			api.put.mockResolvedValue({ data: {} });

			await file.createOrUpdateFile.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/contents/readme.md`, {
				message: 'Update file via n8n',
				content: Buffer.from('hello').toString('base64'),
			});
		});

		it('should require a file path', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, content: 'hello' },
			});

			await expect(file.createOrUpdateFile.call(ctx, api as any, 0)).rejects.toThrow(
				'File path is required'
			);
		});

		it('should require content', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, filePath: 'readme.md' },
			});

			await expect(file.createOrUpdateFile.call(ctx, api as any, 0)).rejects.toThrow(
				'File content is required'
			);
		});
	});

	describe('deleteFile', () => {
		it('should DELETE the file with a commit message and SHA', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'obsolete.md',
					sha: 'abc123',
					commitMessage: 'chore: drop file',
					branch: 'develop',
				},
			});
			api.delete.mockResolvedValue({ data: { commit: {} } });

			await file.deleteFile.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/contents/obsolete.md`, {
				data: {
					message: 'chore: drop file',
					sha: 'abc123',
					branch: 'develop',
				},
			});
		});

		it('should omit the branch when unset', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'obsolete.md',
					sha: 'abc123',
				},
			});
			api.delete.mockResolvedValue({ data: '' });

			const result = await file.deleteFile.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/contents/obsolete.md`, {
				data: {
					message: 'Delete file via n8n',
					sha: 'abc123',
				},
			});
			expect(result).toBe('');
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					filePath: 'obsolete.md',
					sha: 'abc123',
				},
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await file.deleteFile.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require the SHA', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, filePath: 'obsolete.md' },
			});

			await expect(file.deleteFile.call(ctx, api as any, 0)).rejects.toThrow(
				'SHA of the file being deleted is required'
			);
		});
	});
});
