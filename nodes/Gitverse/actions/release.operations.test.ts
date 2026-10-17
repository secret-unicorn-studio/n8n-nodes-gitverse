import * as release from './release.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('release operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyReleases', () => {
		it('should list the releases with the page size', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 7 },
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await release.getManyReleases.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases`, {
				params: { page: 1, per_page: 7 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await release.getManyReleases.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases`, {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('getRelease', () => {
		it('should GET a release by ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, releaseId: 12 } });
			api.get.mockResolvedValue({ data: { id: 12 } });

			const result = await release.getRelease.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases/12`);
			expect(result).toEqual({ id: 12 });
		});

		it('should require an ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(release.getRelease.call(ctx, api as any, 0)).rejects.toThrow(
				'Release ID is required'
			);
		});
	});

	describe('getReleaseByTag', () => {
		it('should GET a release by tag', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseTag: 'v1.0.0' },
			});
			api.get.mockResolvedValue({ data: { tag_name: 'v1.0.0' } });

			const result = await release.getReleaseByTag.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases/tags/v1.0.0`);
			expect(result).toEqual({ tag_name: 'v1.0.0' });
		});

		it('should encode a tag with a slash', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseTag: 'release/1.0' },
			});
			api.get.mockResolvedValue({ data: {} });

			await release.getReleaseByTag.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases/tags/release/1.0`);
		});

		it('should require the tag', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(release.getReleaseByTag.call(ctx, api as any, 0)).rejects.toThrow(
				'Tag is required'
			);
		});
	});

	describe('createRelease', () => {
		it('should POST the release', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					tagName: 'v2.0.0',
					releaseName: 'Second release',
					targetCommitish: 'main',
					releaseBody: 'Changes',
				},
			});
			api.post.mockResolvedValue({ data: { id: 2 } });

			const result = await release.createRelease.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/releases`, {
				tag_name: 'v2.0.0',
				name: 'Second release',
				target_commitish: 'main',
				body: 'Changes',
			});
			expect(result).toEqual({ id: 2 });
		});

		it('should send the flags only when they are set', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					tagName: 'v2.0.0',
					draft: true,
					prerelease: true,
					isAuthorizedOnly: true,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await release.createRelease.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/releases`, {
				tag_name: 'v2.0.0',
				name: '',
				target_commitish: '',
				body: '',
				draft: true,
				prerelease: true,
				is_authorized_only: true,
			});
		});

		it('should require the tag name', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(release.createRelease.call(ctx, api as any, 0)).rejects.toThrow(
				'Tag name is required'
			);
		});
	});

	describe('updateRelease', () => {
		it('should PATCH every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					releaseId: 12,
					updateFields: {
						tagName: 'v2.0.1',
						name: 'Renamed',
						targetCommitish: 'develop',
						body: 'Notes',
						draft: true,
						prerelease: true,
						isAuthorizedOnly: true,
					},
				},
			});
			api.patch.mockResolvedValue({ data: { id: 12 } });

			await release.updateRelease.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/releases/12`, {
				tag_name: 'v2.0.1',
				name: 'Renamed',
				target_commitish: 'develop',
				body: 'Notes',
				draft: true,
				prerelease: true,
				is_authorized_only: true,
			});
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12, updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: {} });

			await release.updateRelease.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/releases/12`, {});
		});
	});

	describe('deleteRelease', () => {
		it('should DELETE the release', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, releaseId: 12 } });
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await release.deleteRelease.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/releases/12`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, releaseId: 12 } });
			api.delete.mockResolvedValue({ data: null });

			expect(await release.deleteRelease.call(ctx, api as any, 0)).toEqual({ success: true });
		});
	});

	describe('deleteReleaseByTag', () => {
		it('should DELETE the release by tag', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseTag: 'v1.0.0' },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await release.deleteReleaseByTag.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/releases/tags/v1.0.0`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseTag: 'v1.0.0' },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await release.deleteReleaseByTag.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});
	});

	describe('getReleaseAssets', () => {
		it('should list the assets of a release', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					releaseId: 12,
					returnAll: false,
					limit: 2,
				},
			});
			api.get.mockResolvedValue({ data: [{ id: 5 }] });

			const result = await release.getReleaseAssets.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/releases/12/assets`, {
				params: { page: 1, per_page: 2 },
			});
			expect(result).toEqual([{ id: 5 }]);
		});
	});

	describe('uploadReleaseAsset', () => {
		it('should POST the file and its name as multipart data', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					releaseId: 12,
					binaryProperty: 'data',
					assetName: 'bundle.zip',
				},
				binary: {
					data: {
						data: Buffer.from('zip'),
						fileName: 'upload.zip',
						mimeType: 'application/zip',
					},
				},
			});
			api.post.mockResolvedValue({ data: { id: 5 } });

			const result = await release.uploadReleaseAsset.call(ctx, api as any, 0);
			const [url, form] = api.post.mock.calls[0];

			expect(url).toBe(`${BASE}/releases/12/assets`);
			expect(form).toBeInstanceOf((globalThis as any).FormData);
			expect((form as any).get('name')).toBe('bundle.zip');

			const file = (form as any).get('attachment');

			expect(file.name).toBe('upload.zip');
			expect(file.type).toBe('application/zip');
			expect(result).toEqual({ id: 5 });
		});

		it('should fall back to the name of the uploaded file', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12 },
				binary: { data: { data: Buffer.from('zip'), fileName: 'upload.zip' } },
			});
			api.post.mockResolvedValue({ data: {} });

			await release.uploadReleaseAsset.call(ctx, api as any, 0);

			const form = api.post.mock.calls[0][1];

			expect((form as any).get('name')).toBe('upload.zip');
			expect((form as any).get('attachment').name).toBe('upload.zip');
		});

		it('should use the asset name when the file has no name', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					releaseId: 12,
					assetName: 'bundle.zip',
				},
				binary: { data: { data: Buffer.from('zip') } },
			});
			api.post.mockResolvedValue({ data: {} });

			await release.uploadReleaseAsset.call(ctx, api as any, 0);

			const form = api.post.mock.calls[0][1];

			expect((form as any).get('attachment').name).toBe('bundle.zip');
		});

		it('should require a name when the file has none', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12 },
				binary: { data: { data: Buffer.from('zip') } },
			});

			await expect(release.uploadReleaseAsset.call(ctx, api as any, 0)).rejects.toThrow(
				'Asset name is required'
			);
		});

		it('should surface a missing binary property', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					releaseId: 12,
					binaryProperty: 'upload',
					assetName: 'bundle.zip',
				},
			});

			await expect(release.uploadReleaseAsset.call(ctx, api as any, 0)).rejects.toThrow(
				'No binary data property "upload"'
			);
		});
	});

	describe('deleteReleaseAsset', () => {
		it('should DELETE the asset', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12, assetId: 5 },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await release.deleteReleaseAsset.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/releases/12/assets/5`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12, assetId: 5 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await release.deleteReleaseAsset.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require an asset ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, releaseId: 12 },
			});

			await expect(release.deleteReleaseAsset.call(ctx, api as any, 0)).rejects.toThrow(
				'Asset ID is required'
			);
		});
	});
});
