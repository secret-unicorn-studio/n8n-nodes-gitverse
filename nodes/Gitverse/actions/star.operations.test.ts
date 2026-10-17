import * as star from './star.operations';
import { GitverseApiError } from '../../../utils/api';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

describe('star operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyStars', () => {
		it('should list the starred repositories with the sort field', async () => {
			const ctx = createContext({
				params: { sort: 'updated', returnAll: false, limit: 2 },
			});
			api.get.mockResolvedValue({ data: [{ name: 'one' }] });

			const result = await star.getManyStars.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/starred', {
				params: { sort: 'updated', page: 1, per_page: 2 },
			});
			expect(result).toEqual([{ name: 'one' }]);
		});

		it('should omit the sort when it is not set and follow every page', async () => {
			const ctx = createContext({ params: { returnAll: true } });
			api.get.mockResolvedValue({ data: [] });

			await star.getManyStars.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/user/starred', {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('checkStar', () => {
		it('should GET the star of a repository', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: { starred: true } });

			expect(await star.checkStar.call(ctx, api as any, 0)).toEqual({ starred: true });
			expect(api.get).toHaveBeenCalledWith(
				'/user/starred/SUSTUDIO/n8n-nodes-gitverse'
			);
		});

		it('should report a starred repository without a payload', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockResolvedValue({ data: null });

			expect(await star.checkStar.call(ctx, api as any, 0)).toEqual({ starred: true });
		});

		it('should report a repository that is not starred', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockRejectedValue(new GitverseApiError(404, { message: 'Not found' }));

			expect(await star.checkStar.call(ctx, api as any, 0)).toEqual({ starred: false });
		});

		it('should rethrow an error without a response', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockRejectedValue(new Error('boom'));

			await expect(star.checkStar.call(ctx, api as any, 0)).rejects.toThrow('boom');
		});

		it('should rethrow any other error', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.get.mockRejectedValue(new GitverseApiError(500, { message: 'boom' }));

			await expect(star.checkStar.call(ctx, api as any, 0)).rejects.toMatchObject({
				status: 500,
			});
		});
	});

	describe('addStar', () => {
		it('should PUT the star', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.put.mockResolvedValue({ data: { ok: true } });

			expect(await star.addStar.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.put).toHaveBeenCalledWith('/user/starred/SUSTUDIO/n8n-nodes-gitverse');
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.put.mockResolvedValue({ data: null });

			expect(await star.addStar.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});

	describe('removeStar', () => {
		it('should DELETE the star', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await star.removeStar.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith('/user/starred/SUSTUDIO/n8n-nodes-gitverse');
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });
			api.delete.mockResolvedValue({ data: null });

			expect(await star.removeStar.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});
});
