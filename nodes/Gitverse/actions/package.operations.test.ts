import * as pkg from './package.operations';
import { createApi, createContext } from '../__testutils__/context';

describe('package operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getPackageVersions', () => {
		it('should list the versions of a user package', async () => {
			const ctx = createContext({
				params: { ownerType: 'user', username: 'alice', packageType: 'npm', packageName: 'my-pkg' },
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await pkg.getPackageVersions.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/users/alice/packages/npm/my-pkg/versions');
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should list the versions of an organization package', async () => {
			const ctx = createContext({
				params: {
					ownerType: 'organization',
					organization: 'my-org',
					packageType: 'maven',
					packageName: 'my-pkg',
				},
			});
			api.get.mockResolvedValue({ data: [] });

			await pkg.getPackageVersions.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/packages/maven/my-pkg/versions');
		});

		it('should require the username of a user package', async () => {
			const ctx = createContext({
				params: { ownerType: 'user', packageType: 'npm', packageName: 'my-pkg' },
			});

			await expect(pkg.getPackageVersions.call(ctx, api as any, 0)).rejects.toThrow(
				'Username is required'
			);
		});

		it('should require the organization of an organization package', async () => {
			const ctx = createContext({
				params: { ownerType: 'organization', packageType: 'npm', packageName: 'my-pkg' },
			});

			await expect(pkg.getPackageVersions.call(ctx, api as any, 0)).rejects.toThrow(
				'Organization is required'
			);
		});
	});

	describe('deletePackageVersion', () => {
		it('should DELETE a version', async () => {
			const ctx = createContext({
				params: {
					ownerType: 'user',
					username: 'alice',
					packageType: 'npm',
					packageName: 'my-pkg',
					versionId: 3,
				},
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await pkg.deletePackageVersion.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith('/users/alice/packages/npm/my-pkg/versions/3');
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: {
					ownerType: 'user',
					username: 'alice',
					packageType: 'npm',
					packageName: 'my-pkg',
					versionId: 3,
				},
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await pkg.deletePackageVersion.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require a version ID', async () => {
			const ctx = createContext({
				params: { ownerType: 'user', username: 'alice', packageType: 'npm', packageName: 'my-pkg' },
			});

			await expect(pkg.deletePackageVersion.call(ctx, api as any, 0)).rejects.toThrow(
				'Package version ID is required'
			);
		});
	});

	describe('deletePackage', () => {
		it('should DELETE the package', async () => {
			const ctx = createContext({
				params: {
					ownerType: 'organization',
					organization: 'my-org',
					packageType: 'npm',
					packageName: 'my-pkg',
				},
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await pkg.deletePackage.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.delete).toHaveBeenCalledWith('/orgs/my-org/packages/npm/my-pkg');
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: {
					ownerType: 'user',
					username: 'alice',
					packageType: 'npm',
					packageName: 'my-pkg',
				},
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await pkg.deletePackage.call(ctx, api as any, 0)).toEqual({ success: true });
		});

		it('should require the package type', async () => {
			const ctx = createContext({
				params: { ownerType: 'user', username: 'alice', packageName: 'my-pkg' },
			});

			await expect(pkg.deletePackage.call(ctx, api as any, 0)).rejects.toThrow(
				'Package type is required'
			);
		});
	});
});
