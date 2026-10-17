import * as user from './user.operations';
import { createApi, createContext } from '../__testutils__/context';

describe('user operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getUser', () => {
		it('should GET the authenticated user', async () => {
			const ctx = createContext();
			api.get.mockResolvedValue({ data: { login: 'alice' } });

			const result = await user.getUser.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user');
			expect(result).toEqual({ login: 'alice' });
		});
	});

	describe('getUserByLogin', () => {
		it('should GET a user by login', async () => {
			const ctx = createContext({ params: { username: 'alice' } });
			api.get.mockResolvedValue({ data: { login: 'alice' } });

			await user.getUserByLogin.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/users/alice');
		});

		it('should encode an unusual login', async () => {
			const ctx = createContext({ params: { username: 'a b' } });
			api.get.mockResolvedValue({ data: {} });

			await user.getUserByLogin.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/users/a%20b');
		});

		it('should require the login', async () => {
			const ctx = createContext();

			await expect(user.getUserByLogin.call(ctx, api as any, 0)).rejects.toThrow(
				'Username is required'
			);
		});
	});

	describe('getUserById', () => {
		it('should GET a user by account ID', async () => {
			const ctx = createContext({ params: { accountId: 789 } });
			api.get.mockResolvedValue({ data: { id: 789 } });

			const result = await user.getUserById.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/789');
			expect(result).toEqual({ id: 789 });
		});

		it('should require the account ID', async () => {
			const ctx = createContext();

			await expect(user.getUserById.call(ctx, api as any, 0)).rejects.toThrow(
				'Account ID is required'
			);
		});
	});

	describe('getUserEmails', () => {
		it('should list the emails with the page size', async () => {
			const ctx = createContext({ params: { returnAll: false, limit: 3 } });
			api.get.mockResolvedValue({ data: [{ email: 'a@b.c' }] });

			const result = await user.getUserEmails.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/emails', {
				params: { page: 1, per_page: 3 },
			});
			expect(result).toEqual([{ email: 'a@b.c' }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({ params: { returnAll: true } });
			api.get.mockResolvedValue({ data: [] });

			await user.getUserEmails.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/emails', {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('addUserEmails', () => {
		it('should POST the emails', async () => {
			const ctx = createContext({ params: { emails: 'a@b.c, d@e.f' } });
			api.post.mockResolvedValue({ data: [{ email: 'a@b.c' }] });

			const result = await user.addUserEmails.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/user/emails', {
				emails: ['a@b.c', 'd@e.f'],
			});
			expect(result).toEqual([{ email: 'a@b.c' }]);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { emails: 'a@b.c' } });
			api.post.mockResolvedValue({ data: null });

			expect(await user.addUserEmails.call(ctx, api as any, 0)).toEqual({ success: true });
		});

		it('should send an empty list when nothing is configured', async () => {
			const ctx = createContext();
			api.post.mockResolvedValue({ data: {} });

			await user.addUserEmails.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/user/emails', { emails: [] });
		});
	});

	describe('deleteUserEmails', () => {
		it('should DELETE the emails through the body', async () => {
			const ctx = createContext({ params: { emails: 'a@b.c' } });
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await user.deleteUserEmails.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith('/user/emails', {
				data: { emails: ['a@b.c'] },
			});
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { emails: 'a@b.c' } });
			api.delete.mockResolvedValue({ data: null });

			expect(await user.deleteUserEmails.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});

	describe('searchUsers', () => {
		it('should pass the query, the sorting and the pagination', async () => {
			const ctx = createContext({
				params: {
					searchQuery: 'ali',
					searchSort: 'followers',
					searchOrder: 'asc',
					returnAll: false,
					limit: 2,
				},
			});
			api.get.mockResolvedValue({ data: [{ login: 'alice' }] });

			const result = await user.searchUsers.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/search/users', {
				params: {
					q: 'ali',
					sort: 'followers',
					order: 'asc',
					page: 1,
					per_page: 2,
				},
			});
			expect(result).toEqual([{ login: 'alice' }]);
		});

		it('should omit the sorting when it is not set', async () => {
			const ctx = createContext({ params: { searchQuery: 'ali', returnAll: true } });
			api.get.mockResolvedValue({ data: [] });

			await user.searchUsers.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/search/users', {
				params: { q: 'ali', page: 1, per_page: 50 },
			});
		});

		it('should require the query', async () => {
			const ctx = createContext();

			await expect(user.searchUsers.call(ctx, api as any, 0)).rejects.toThrow(
				'Search query is required'
			);
		});
	});
});
