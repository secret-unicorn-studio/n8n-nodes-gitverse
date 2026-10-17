import * as organization from './organization.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

describe('organization operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getOrgTeams', () => {
		it('should list the teams with the page size', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', returnAll: false, limit: 4 },
			});
			api.get.mockResolvedValue({ data: [{ name: 'core' }] });

			const result = await organization.getOrgTeams.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/teams', {
				params: { page: 1, per_page: 4 },
			});
			expect(result).toEqual([{ name: 'core' }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({ params: { organization: 'my-org', returnAll: true } });
			api.get.mockResolvedValue({ data: [] });

			await organization.getOrgTeams.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/teams', {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should require the organization', async () => {
			const ctx = createContext();

			await expect(organization.getOrgTeams.call(ctx, api as any, 0)).rejects.toThrow(
				'Organization is required'
			);
		});
	});

	describe('createOrgTeam', () => {
		it('should POST every provided field', async () => {
			const ctx = createContext({
				params: {
					organization: 'my-org',
					teamName: 'core',
					teamDescription: 'Core team',
					teamPrivacy: 'secret',
					notificationSetting: 'notifications_disabled',
					teamPermission: 'push',
					canCreateOrgRepo: true,
					maintainers: 'alice, bob',
					repoNames: 'my-org/one, my-org/two',
				},
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			const result = await organization.createOrgTeam.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/orgs/my-org/teams', {
				name: 'core',
				description: 'Core team',
				privacy: 'secret',
				notification_setting: 'notifications_disabled',
				permission: 'push',
				can_create_org_repo: true,
				maintainers: ['alice', 'bob'],
				repo_names: ['my-org/one', 'my-org/two'],
			});
			expect(result).toEqual({ id: 1 });
		});

		it('should send the name alone', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', teamName: 'core' },
			});
			api.post.mockResolvedValue({ data: {} });

			await organization.createOrgTeam.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith('/orgs/my-org/teams', { name: 'core' });
		});

		it('should require the team name', async () => {
			const ctx = createContext({ params: { organization: 'my-org' } });

			await expect(organization.createOrgTeam.call(ctx, api as any, 0)).rejects.toThrow(
				'Team name is required'
			);
		});
	});

	describe('getTeamMembers', () => {
		it('should list the members of a team', async () => {
			const ctx = createContext({
				params: {
					organization: 'my-org',
					team: 'core',
					returnAll: false,
					limit: 5,
				},
			});
			api.get.mockResolvedValue({ data: [{ login: 'alice' }] });

			await organization.getTeamMembers.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/teams/core/members', {
				params: { page: 1, per_page: 5 },
			});
		});

		it('should require the team', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', returnAll: true },
			});

			await expect(organization.getTeamMembers.call(ctx, api as any, 0)).rejects.toThrow(
				'Team is required'
			);
		});
	});

	describe('getOrgMember', () => {
		it('should GET a member', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', username: 'alice' },
			});
			api.get.mockResolvedValue({ data: { login: 'alice' } });

			const result = await organization.getOrgMember.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/members/alice');
			expect(result).toEqual({ login: 'alice' });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', username: 'alice' },
			});
			api.get.mockResolvedValue({ data: null });

			expect(await organization.getOrgMember.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require the username', async () => {
			const ctx = createContext({ params: { organization: 'my-org' } });

			await expect(organization.getOrgMember.call(ctx, api as any, 0)).rejects.toThrow(
				'Username is required'
			);
		});
	});

	describe('getTeamRepos', () => {
		it('should list the repositories of a team', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', team: 'core', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ name: 'one' }] });

			const result = await organization.getTeamRepos.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/teams/core/repos', {
				params: { page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ name: 'one' }]);
		});
	});

	describe('setTeamRepo', () => {
		it('should PUT the repository with the permission', async () => {
			const ctx = createContext({
				params: {
					organization: 'my-org',
					team: 'core',
					repository: repositoryLocator,
					permission: 'write',
				},
			});
			api.put.mockResolvedValue({ data: { ok: true } });

			const result = await organization.setTeamRepo.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(
				'/orgs/my-org/teams/core/repos/SUSTUDIO/n8n-nodes-gitverse',
				{ permission: 'write' }
			);
			expect(result).toEqual({ ok: true });
		});

		it('should default the permission to read', async () => {
			const ctx = createContext({
				params: { organization: 'my-org', team: 'core', repository: repositoryLocator },
			});
			api.put.mockResolvedValue({ data: null });

			expect(await organization.setTeamRepo.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
			expect(api.put).toHaveBeenCalledWith(
				'/orgs/my-org/teams/core/repos/SUSTUDIO/n8n-nodes-gitverse',
				{ permission: 'read' }
			);
		});
	});

	describe('getOrgIssueTypes', () => {
		it('should GET the issue types of the organization', async () => {
			const ctx = createContext({ params: { organization: 'my-org' } });
			api.get.mockResolvedValue({ data: [{ code: 'bug' }] });

			const result = await organization.getOrgIssueTypes.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/issue-types');
			expect(result).toEqual([{ code: 'bug' }]);
		});
	});
});
