import * as hook from './hook.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('hook operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyHooks', () => {
		it('should list the hooks with the page size', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 3 },
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await hook.getManyHooks.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/hooks`, {
				params: { page: 1, per_page: 3 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await hook.getManyHooks.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/hooks`, {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('getHook', () => {
		it('should GET a hook by ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, hookId: 12 } });
			api.get.mockResolvedValue({ data: { id: 12 } });

			const result = await hook.getHook.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/hooks/12`);
			expect(result).toEqual({ id: 12 });
		});

		it('should require an ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(hook.getHook.call(ctx, api as any, 0)).rejects.toThrow(
				'Hook ID is required'
			);
		});
	});

	describe('createHook', () => {
		it('should POST the hook with every configured field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					url: 'https://example.com/hook',
					events: ['push', 'pull_request'],
					active: true,
					contentType: 'json',
					httpMethod: 'POST',
					authorizationHeader: 'Bearer secret',
					branchFilter: 'main',
				},
			});
			api.post.mockResolvedValue({ data: { id: 12 } });

			const result = await hook.createHook.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/hooks`, {
				active: true,
				events: ['push', 'pull_request'],
				config: {
					url: 'https://example.com/hook',
					content_type: 'json',
					http_method: 'POST',
					authorization_header: 'Bearer secret',
					branch_filter: 'main',
				},
			});
			expect(result).toEqual({ id: 12 });
		});

		it('should omit the empty optional config fields and default to push', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					url: 'https://example.com/hook',
					contentType: 'json',
					httpMethod: 'POST',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await hook.createHook.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/hooks`, {
				active: true,
				events: ['push'],
				config: {
					url: 'https://example.com/hook',
					content_type: 'json',
					http_method: 'POST',
				},
			});
		});

		it('should keep an explicitly disabled hook disabled', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					url: 'https://example.com/hook',
					events: ['fork'],
					active: false,
					contentType: 'form',
					httpMethod: 'GET',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await hook.createHook.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/hooks`, {
				active: false,
				events: ['fork'],
				config: {
					url: 'https://example.com/hook',
					content_type: 'form',
					http_method: 'GET',
				},
			});
		});

		it('should accept a single event as a string', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					url: 'https://example.com/hook',
					events: 'delete',
					contentType: 'json',
					httpMethod: 'POST',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await hook.createHook.call(ctx, api as any, 0);

			expect(api.post.mock.calls[0][1].events).toEqual(['delete']);
		});

		it('should require the payload URL', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(hook.createHook.call(ctx, api as any, 0)).rejects.toThrow(
				'Payload URL is required'
			);
		});
	});

	describe('updateHook', () => {
		it('should PATCH every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					hookId: 12,
					updateFields: {
						active: false,
						events: ['push'],
						addEvents: ['fork'],
						removeEvents: ['create'],
						url: 'https://example.com/new',
						contentType: 'form',
						httpMethod: 'GET',
						authorizationHeader: 'Bearer new',
						branchFilter: 'release/*',
					},
				},
			});
			api.patch.mockResolvedValue({ data: { id: 12 } });

			await hook.updateHook.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/hooks/12`, {
				active: false,
				events: ['push'],
				add_events: ['fork'],
				remove_events: ['create'],
				config: {
					url: 'https://example.com/new',
					content_type: 'form',
					http_method: 'GET',
					authorization_header: 'Bearer new',
					branch_filter: 'release/*',
				},
			});
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, hookId: 12, updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: {} });

			await hook.updateHook.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/hooks/12`, {});
		});

		it('should clear the event lists when they are emptied', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					hookId: 12,
					updateFields: { events: [], addEvents: [], removeEvents: [] },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await hook.updateHook.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/hooks/12`, {
				events: [],
				add_events: [],
				remove_events: [],
			});
		});

		it('should tolerate a comma-separated event list and a missing one', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					hookId: 12,
					updateFields: { events: null, addEvents: 'fork, delete' },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await hook.updateHook.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/hooks/12`, {
				events: [],
				add_events: ['fork', 'delete'],
			});
		});

		it('should only send the config when a config field is set', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					hookId: 12,
					updateFields: { branchFilter: 'main' },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await hook.updateHook.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/hooks/12`, {
				config: { branch_filter: 'main' },
			});
		});

		it('should require an ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(hook.updateHook.call(ctx, api as any, 0)).rejects.toThrow(
				'Hook ID is required'
			);
		});
	});

	describe('deleteHook', () => {
		it('should DELETE the hook', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, hookId: 12 } });
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await hook.deleteHook.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/hooks/12`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, hookId: 12 } });
			api.delete.mockResolvedValue({ data: null });

			expect(await hook.deleteHook.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});
});
