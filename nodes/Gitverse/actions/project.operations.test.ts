import * as project from './project.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse/projects';

describe('project operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyProjects', () => {
		it('should GET the projects of the repository', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await project.getManyProjects.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(BASE);
			expect(result).toEqual([{ id: 1 }]);
		});
	});

	describe('getProject', () => {
		it('should GET a project by ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, projectId: 7 } });
			api.get.mockResolvedValue({ data: { id: 7 } });

			const result = await project.getProject.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/7`);
			expect(result).toEqual({ id: 7 });
		});

		it('should require an ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(project.getProject.call(ctx, api as any, 0)).rejects.toThrow(
				'Project ID is required'
			);
		});
	});

	describe('createProject', () => {
		it('should POST every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectTitle: 'Release planning',
					projectDescription: 'Tasks for the next release',
					projectPrivate: true,
					templateType: 1,
				},
			});
			api.post.mockResolvedValue({ data: { id: 7 } });

			const result = await project.createProject.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(BASE, {
				title: 'Release planning',
				description: 'Tasks for the next release',
				private: true,
				template_type: 1,
			});
			expect(result).toEqual({ id: 7 });
		});

		it('should send the title alone', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectTitle: 'Minimal' },
			});
			api.post.mockResolvedValue({ data: {} });

			await project.createProject.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(BASE, { title: 'Minimal' });
		});

		it('should require the title', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(project.createProject.call(ctx, api as any, 0)).rejects.toThrow(
				'Project title is required'
			);
		});
	});

	describe('updateProject', () => {
		it('should PATCH every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					updateFields: {
						title: 'Renamed',
						description: 'Short',
						private: false,
						state: 'closed',
					},
				},
			});
			api.patch.mockResolvedValue({ data: { id: 7 } });

			await project.updateProject.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/7`, {
				title: 'Renamed',
				description: 'Short',
				private: false,
				state: 'closed',
			});
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectId: 7, updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: {} });

			await project.updateProject.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/7`, {});
		});
	});

	describe('deleteProject', () => {
		it('should DELETE the project', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, projectId: 7 } });
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await project.deleteProject.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/7`);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, projectId: 7 } });
			api.delete.mockResolvedValue({ data: null });

			expect(await project.deleteProject.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});

	describe('createProjectColumn', () => {
		it('should POST the column and keep a full hex colour', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnTitle: 'Code review',
					columnColor: '#8250DF',
				},
			});
			api.post.mockResolvedValue({ data: { id: 3 } });

			const result = await project.createProjectColumn.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/7/columns`, {
				title: 'Code review',
				color: '#8250DF',
			});
			expect(result).toEqual({ id: 3 });
		});

		it('should add the missing hash and omit an empty colour', async () => {
			const withColor = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnTitle: 'Done',
					columnColor: '8250DF',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await project.createProjectColumn.call(withColor, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/7/columns`, {
				title: 'Done',
				color: '#8250DF',
			});

			const withoutColor = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnTitle: 'Done',
					columnColor: '   ',
				},
			});

			await project.createProjectColumn.call(withoutColor, api as any, 0);

			expect(api.post).toHaveBeenLastCalledWith(`${BASE}/7/columns`, { title: 'Done' });
		});

		it('should require the column title', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectId: 7 },
			});

			await expect(project.createProjectColumn.call(ctx, api as any, 0)).rejects.toThrow(
				'Column title is required'
			);
		});
	});

	describe('updateProjectColumn', () => {
		it('should PATCH every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnId: 3,
					columnFields: {
						title: 'Backlog',
						color: '6E7191',
						default: true,
						sorting: 2,
					},
				},
			});
			api.patch.mockResolvedValue({ data: { id: 3 } });

			await project.updateProjectColumn.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/7/columns/3`, {
				title: 'Backlog',
				color: '#6E7191',
				default: true,
				sorting: 2,
			});
		});

		it('should treat a missing colour as an empty string', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnId: 3,
					columnFields: { color: null },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await project.updateProjectColumn.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/7/columns/3`, { color: '' });
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					projectId: 7,
					columnId: 3,
					columnFields: {},
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await project.updateProjectColumn.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/7/columns/3`, {});
		});

		it('should require a column ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectId: 7 },
			});

			await expect(project.updateProjectColumn.call(ctx, api as any, 0)).rejects.toThrow(
				'Column ID is required'
			);
		});
	});

	describe('deleteProjectColumn', () => {
		it('should DELETE the column', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectId: 7, columnId: 3 },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await project.deleteProjectColumn.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/7/columns/3`);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, projectId: 7, columnId: 3 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await project.deleteProjectColumn.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});
	});
});
