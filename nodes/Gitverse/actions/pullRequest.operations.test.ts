import * as pullRequest from './pullRequest.operations';
import { GitverseApiError } from '../../../utils/api';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('pull request operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getPullRequest', () => {
		it('should GET a pull request by number', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockResolvedValue({ data: { number: 7 } });

			const result = await pullRequest.getPullRequest.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7`);
			expect(result).toEqual({ number: 7 });
		});

		it('should require a number', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(pullRequest.getPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Pull request number is required'
			);
		});
	});

	describe('getManyPullRequests', () => {
		it('should list pull requests filtered by state', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, state: 'all', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ number: 1 }] });

			const result = await pullRequest.getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls`, {
				params: { state: 'all', page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ number: 1 }]);
		});

		it('should default the state to open', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 2 },
			});
			api.get.mockResolvedValue({ data: [] });

			await pullRequest.getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls`, {
				params: { state: 'open', page: 1, per_page: 2 },
			});
		});

		it('should pass the head, base, sort and direction filters', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					head: 'alice:feature',
					base: 'main',
					sort: 'updated',
					direction: 'asc',
					returnAll: false,
					limit: 1,
				},
			});
			api.get.mockResolvedValue({ data: [] });

			await pullRequest.getManyPullRequests.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls`, {
				params: {
					state: 'open',
					head: 'alice:feature',
					base: 'main',
					sort: 'updated',
					direction: 'asc',
					page: 1,
					per_page: 1,
				},
			});
		});
	});

	describe('createPullRequest', () => {
		it('should POST the full pull request', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					title: 'Add feature',
					head: 'feature/x',
					headRepo: 'alice/fork',
					base: 'main',
					body: 'Details',
					draft: true,
					assignees: 'alice, bob',
					labels: '1, 2',
					milestone: 3,
				},
			});
			api.post.mockResolvedValue({ data: { number: 1 } });

			await pullRequest.createPullRequest.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls`, {
				title: 'Add feature',
				head: 'feature/x',
				head_repo: 'alice/fork',
				base: 'main',
				body: 'Details',
				draft: true,
				assignees: ['alice', 'bob'],
				labels: [1, 2],
				milestone: 3,
			});
		});

		it('should omit the optional fields', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					title: 'Add feature',
					head: 'feature/x',
					base: 'main',
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await pullRequest.createPullRequest.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls`, {
				title: 'Add feature',
				head: 'feature/x',
				base: 'main',
				body: '',
			});
		});

		it('should require a title', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, head: 'feature/x', base: 'main' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Title is required'
			);
		});

		it('should require a head branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, title: 'T', base: 'main' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Head branch is required'
			);
		});

		it('should require a base branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, title: 'T', head: 'feature/x' },
			});

			await expect(pullRequest.createPullRequest.call(ctx, api as any, 0)).rejects.toThrow(
				'Base branch is required'
			);
		});
	});

	describe('updatePullRequest', () => {
		it('should PATCH only the provided fields', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					updateFields: {
						title: 'New title',
						body: 'New body',
						state: 'closed',
						base: 'develop',
						maintainerCanModify: false,
						assignees: 'alice, bob',
					},
				},
			});
			api.patch.mockResolvedValue({ data: { number: 7 } });

			await pullRequest.updatePullRequest.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/pulls/7`, {
				title: 'New title',
				body: 'New body',
				state: 'closed',
				base: 'develop',
				maintainer_can_modify: false,
				assignees: ['alice', 'bob'],
			});
		});

		it('should send an empty assignee list to clear the assignees', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					updateFields: { assignees: '' },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await pullRequest.updatePullRequest.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/pulls/7`, { assignees: [] });
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					updateFields: {},
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await pullRequest.updatePullRequest.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/pulls/7`, {});
		});

		it('should treat a missing assignee value as an empty list', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					updateFields: { assignees: null },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await pullRequest.updatePullRequest.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/pulls/7`, { assignees: [] });
		});
	});

	describe('updatePullRequestBranch', () => {
		it('should PUT the update-branch endpoint with the expected SHA', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					expectedHeadSha: 'abc123',
				},
			});
			api.put.mockResolvedValue({ data: { message: 'ok' } });

			const result = await pullRequest.updatePullRequestBranch.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/pulls/7/update-branch`, {
				expected_head_sha: 'abc123',
			});
			expect(result).toEqual({ message: 'ok' });
		});

		it('should omit the SHA when unset', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.put.mockResolvedValue({ data: null });

			const result = await pullRequest.updatePullRequestBranch.call(ctx, api as any, 0);

			expect(api.put).toHaveBeenCalledWith(`${BASE}/pulls/7/update-branch`, {
				expected_head_sha: undefined,
			});
			expect(result).toEqual({ success: true });
		});
	});

	describe('getPullRequestMergeStatus', () => {
		it('should report a mergeable pull request', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockResolvedValue({ status: 204 });

			const result = await pullRequest.getPullRequestMergeStatus.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7/merge`);
			expect(result).toEqual({ mergeable: true });
		});

		it('should report a conflicting pull request as not mergeable', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockRejectedValue(new GitverseApiError(404, { message: 'Not found' }));

			const result = await pullRequest.getPullRequestMergeStatus.call(ctx, api as any, 0);

			expect(result).toEqual({ mergeable: false });
		});

		it('should rethrow other failures', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockRejectedValue(new GitverseApiError(500, { message: 'boom' }));

			await expect(
				pullRequest.getPullRequestMergeStatus.call(ctx, api as any, 0)
			).rejects.toMatchObject({ status: 500 });
		});

		it('should rethrow non-api failures', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.get.mockRejectedValue(new Error('boom'));

			await expect(
				pullRequest.getPullRequestMergeStatus.call(ctx, api as any, 0)
			).rejects.toThrow('boom');
		});

		it('should rethrow failures without a Gitverse status', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			const failure = Object.assign(new Error('network'), { response: { status: 404 } });
			api.get.mockRejectedValue(failure);

			await expect(
				pullRequest.getPullRequestMergeStatus.call(ctx, api as any, 0)
			).rejects.toBe(failure);
		});
	});

	describe('getPullRequestFiles', () => {
		it('should list the changed files with pagination', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, returnAll: false, limit: 4 },
			});
			api.get.mockResolvedValue({ data: [{ filename: 'a.ts' }] });

			const result = await pullRequest.getPullRequestFiles.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7/files`, {
				params: { page: 1, per_page: 4 },
			});
			expect(result).toEqual([{ filename: 'a.ts' }]);
		});
	});

	describe('getPullRequestCommits', () => {
		it('should list the commits with pagination', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ sha: 'a' }] });

			const result = await pullRequest.getPullRequestCommits.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7/commits`, {
				params: { page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ sha: 'a' }]);
		});
	});

	describe('createPullRequestComment', () => {
		it('should POST an inline comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					comment: 'Looks good',
					commitId: 'abc123',
					filePath: 'src/index.ts',
					line: 12,
					side: 'RIGHT',
					inReplyTo: 3,
				},
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			await pullRequest.createPullRequestComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/comments`, {
				body: 'Looks good',
				commit_id: 'abc123',
				path: 'src/index.ts',
				line: 12,
				side: 'RIGHT',
				in_reply_to: 3,
			});
		});

		it('should POST a plain comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					comment: 'Thanks',
				},
			});
			api.post.mockResolvedValue({ data: { id: 2 } });

			await pullRequest.createPullRequestComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/comments`, {
				body: 'Thanks',
			});
		});

		it('should require the comment text', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});

			await expect(
				pullRequest.createPullRequestComment.call(ctx, api as any, 0)
			).rejects.toThrow('Comment body is required');
		});
	});

	describe('getPullRequestReviews', () => {
		it('should list reviews using the limit parameter', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					returnAll: false,
					limit: 3,
				},
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await pullRequest.getPullRequestReviews.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews`, {
				params: { page: 1, limit: 3 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await pullRequest.getPullRequestReviews.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews`, {
				params: { page: 1, limit: 50 },
			});
		});
	});

	describe('createPullRequestReview', () => {
		it('should POST the review with line comments', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					event: 'COMMENT',
					reviewBody: 'Nice work',
					commitId: 'abc123',
					reviewComments: {
						comment: [
							{ path: 'src/index.ts', body: 'Here', position: 4 },
							{ path: 'src/old.ts', body: 'Gone', oldPosition: 2, position: 0 },
						],
					},
				},
			});
			api.post.mockResolvedValue({ data: { id: 5 } });

			const result = await pullRequest.createPullRequestReview.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews`, {
				event: 'COMMENT',
				body: 'Nice work',
				commit_id: 'abc123',
				comments: [
					{ path: 'src/index.ts', body: 'Here', new_position: 4 },
					{ path: 'src/old.ts', body: 'Gone', old_position: 2 },
				],
			});
			expect(result).toEqual({ id: 5 });
		});

		it('should default the event to PENDING and omit the comments', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});
			api.post.mockResolvedValue({ data: {} });

			await pullRequest.createPullRequestReview.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews`, {
				event: 'PENDING',
				body: '',
			});
		});

		it('should omit the positions of a file-level comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					reviewComments: {
						comment: [{ path: 'src/index.ts', body: 'Overall note' }],
					},
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await pullRequest.createPullRequestReview.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews`, {
				event: 'PENDING',
				body: '',
				comments: [{ path: 'src/index.ts', body: 'Overall note' }],
			});
		});
	});

	describe('submitPullRequestReview', () => {
		it('should POST the review event', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					reviewId: 5,
					event: 'APPROVED',
					reviewBody: 'LGTM',
				},
			});
			api.post.mockResolvedValue({ data: { id: 5 } });

			const result = await pullRequest.submitPullRequestReview.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews/5/events`, {
				event: 'APPROVED',
				body: 'LGTM',
			});
			expect(result).toEqual({ id: 5 });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					pullRequestNumber: 7,
					reviewId: 5,
					event: 'COMMENT',
				},
			});
			api.post.mockResolvedValue({ data: null });

			expect(await pullRequest.submitPullRequestReview.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require a review ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, event: 'COMMENT' },
			});

			await expect(
				pullRequest.submitPullRequestReview.call(ctx, api as any, 0)
			).rejects.toThrow('Review ID is required');
		});

		it('should require an event', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, reviewId: 5 },
			});

			await expect(
				pullRequest.submitPullRequestReview.call(ctx, api as any, 0)
			).rejects.toThrow('Review event is required');
		});
	});

	describe('deletePullRequestReview', () => {
		it('should DELETE the review', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, reviewId: 5 },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await pullRequest.deletePullRequestReview.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/pulls/7/reviews/5`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7, reviewId: 5 },
			});
			api.delete.mockResolvedValue({ data: undefined });

			expect(await pullRequest.deletePullRequestReview.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require a review ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, pullRequestNumber: 7 },
			});

			await expect(
				pullRequest.deletePullRequestReview.call(ctx, api as any, 0)
			).rejects.toThrow('Review ID is required');
		});
	});
});
