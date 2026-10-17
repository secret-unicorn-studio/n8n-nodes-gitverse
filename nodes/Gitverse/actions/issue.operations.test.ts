import * as issue from './issue.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('issue operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyIssues', () => {
		it('should send state=all by default', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, returnAll: true } });
			api.get.mockResolvedValue({ data: [{ number: 1 }] });

			const result = await issue.getManyIssues.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues`, {
				params: { state: 'all', page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ number: 1 }]);
		});

		it('should pass every filter', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					state: 'open',
					assignee: 'alice',
					issueType: 'bug',
					creator: 'bob',
					labels: 'bug, ui',
					sort: 'updated',
					direction: 'asc',
					since: '2025-01-01T00:00:00Z',
					returnAll: false,
					limit: 5,
				},
			});
			api.get.mockResolvedValue({ data: [] });

			await issue.getManyIssues.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues`, {
				params: {
					state: 'open',
					assignee: 'alice',
					type: 'bug',
					creator: 'bob',
					labels: 'bug,ui',
					sort: 'updated',
					direction: 'asc',
					since: '2025-01-01T00:00:00Z',
					page: 1,
					per_page: 5,
				},
			});
		});

		it('should treat an empty state as all', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, state: '', returnAll: false, limit: 1 },
			});
			api.get.mockResolvedValue({ data: [] });

			await issue.getManyIssues.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues`, {
				params: { state: 'all', page: 1, per_page: 1 },
			});
		});
	});

	describe('getIssue', () => {
		it('should GET an issue by number', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4 },
			});
			api.get.mockResolvedValue({ data: { number: 4 } });

			const result = await issue.getIssue.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/4`);
			expect(result).toEqual({ number: 4 });
		});

		it('should require a number', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(issue.getIssue.call(ctx, api as any, 0)).rejects.toThrow(
				'Issue number is required'
			);
		});
	});

	describe('updateIssue', () => {
		it('should PATCH the provided fields', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					updateFields: {
						title: 'New title',
						body: 'New body',
						state: 'closed',
						issueType: 'bug',
						labels: 'bug, ui',
						assignees: 'alice, bob',
					},
				},
			});
			api.patch.mockResolvedValue({ data: { number: 4 } });

			await issue.updateIssue.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/issues/4`, {
				title: 'New title',
				body: 'New body',
				state: 'closed',
				type: 'bug',
				labels: ['bug', 'ui'],
				assignees: ['alice', 'bob'],
			});
		});

		it('should send empty lists to clear labels and assignees', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					updateFields: { labels: '', assignees: null },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await issue.updateIssue.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/issues/4`, {
				labels: [],
				assignees: [],
			});
		});

		it('should treat a missing label value as an empty list', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					updateFields: { labels: null },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await issue.updateIssue.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/issues/4`, { labels: [] });
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: {} });

			await issue.updateIssue.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/issues/4`, {});
		});
	});

	describe('getIssueComments', () => {
		it('should list the comments with the time filters', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					since: '2025-01-01T00:00:00Z',
					before: '2026-01-01T00:00:00Z',
				},
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await issue.getIssueComments.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, {
				params: { since: '2025-01-01T00:00:00Z', before: '2026-01-01T00:00:00Z' },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should send no parameters by default', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4 },
			});
			api.get.mockResolvedValue({ data: [] });

			await issue.getIssueComments.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, { params: {} });
		});

		it('should wrap a single comment in an array', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4 },
			});
			api.get.mockResolvedValue({ data: { id: 9 } });

			expect(await issue.getIssueComments.call(ctx, api as any, 0)).toEqual([{ id: 9 }]);
		});
	});

	describe('getIssueComment', () => {
		it('should GET a comment by its ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77 },
			});
			api.get.mockResolvedValue({ data: { id: 77 } });

			const result = await issue.getIssueComment.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/comments/77`);
			expect(result).toEqual({ id: 77 });
		});

		it('should require a comment ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(issue.getIssueComment.call(ctx, api as any, 0)).rejects.toThrow(
				'Comment ID is required'
			);
		});
	});

	describe('createIssueComment', () => {
		it('should POST a plain comment', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, comment: 'Hello' },
			});
			api.post.mockResolvedValue({ data: { id: 1 } });

			await issue.createIssueComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, { body: 'Hello' });
		});

		it('should reply inside a thread', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					comment: 'Thread reply',
					threadId: 12,
					replyTo: 9,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await issue.createIssueComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, {
				body: 'Thread reply',
				thread_id: 12,
			});
		});

		it('should reply to a comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					comment: 'Reply',
					replyTo: 9,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await issue.createIssueComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, {
				body: 'Reply',
				reply_to: 9,
			});
		});

		it('should flag a review comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					comment: 'Review',
					isReview: true,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await issue.createIssueComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, {
				body: 'Review',
				is_review: true,
			});
		});

		it('should flag a thread comment', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					comment: 'Thread',
					isThread: true,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await issue.createIssueComment.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments`, {
				body: 'Thread',
				is_thread: true,
			});
		});

		it('should require the comment text', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4 },
			});

			await expect(issue.createIssueComment.call(ctx, api as any, 0)).rejects.toThrow(
				'Comment body is required'
			);
		});
	});

	describe('updateIssueComment', () => {
		it('should PATCH the comment body', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77, comment: 'Fixed' },
			});
			api.patch.mockResolvedValue({ data: { id: 77 } });

			await issue.updateIssueComment.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/issues/4/comments/77`, { body: 'Fixed' });
		});

		it('should require the comment text', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77 },
			});

			await expect(issue.updateIssueComment.call(ctx, api as any, 0)).rejects.toThrow(
				'Comment body is required'
			);
		});
	});

	describe('deleteIssueComment', () => {
		it('should DELETE the comment', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77 },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await issue.deleteIssueComment.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/issues/4/comments/77`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await issue.deleteIssueComment.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});
	});

	describe('addIssueCommentReaction', () => {
		it('should POST the reaction', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					commentId: 77,
					reaction: '+1',
				},
			});
			api.post.mockResolvedValue({ data: { id: 3 } });

			const result = await issue.addIssueCommentReaction.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/issues/4/comments/77/reactions`, {
				content: '+1',
			});
			expect(result).toEqual({ id: 3 });
		});

		it('should require the reaction', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77 },
			});

			await expect(issue.addIssueCommentReaction.call(ctx, api as any, 0)).rejects.toThrow(
				'Reaction is required'
			);
		});
	});

	describe('deleteIssueCommentReaction', () => {
		it('should DELETE the reaction', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					commentId: 77,
					reactionId: 3,
				},
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			await issue.deleteIssueCommentReaction.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/issues/4/comments/77/reactions/3`);
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					commentId: 77,
					reactionId: 3,
				},
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await issue.deleteIssueCommentReaction.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require a reaction ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, commentId: 77 },
			});

			await expect(issue.deleteIssueCommentReaction.call(ctx, api as any, 0)).rejects.toThrow(
				'Reaction ID is required'
			);
		});
	});

	describe('getIssueTimeline', () => {
		it('should list the timeline with the time filters', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					issueNumber: 4,
					since: '2025-01-01T00:00:00Z',
					before: '2026-01-01T00:00:00Z',
					returnAll: false,
					limit: 3,
				},
			});
			api.get.mockResolvedValue({ data: [{ type: 'comment' }] });

			const result = await issue.getIssueTimeline.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/4/timeline`, {
				params: {
					since: '2025-01-01T00:00:00Z',
					before: '2026-01-01T00:00:00Z',
					page: 1,
					per_page: 3,
				},
			});
			expect(result).toEqual([{ type: 'comment' }]);
		});

		it('should follow every page when returnAll is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, issueNumber: 4, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await issue.getIssueTimeline.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/issues/4/timeline`, {
				params: { page: 1, per_page: 50 },
			});
		});
	});

	describe('addIssueCommentAttachment', () => {
		it('should POST the file as multipart data', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					commentId: 77,
					binaryProperty: 'data',
				},
				binary: {
					data: { data: Buffer.from('hello'), fileName: 'note.txt', mimeType: 'text/plain' },
				},
			});
			api.post.mockResolvedValue({ data: { id: 5 } });

			const result = await issue.addIssueCommentAttachment.call(ctx, api as any, 0);
			const [url, form] = api.post.mock.calls[0];

			expect(url).toBe(`${BASE}/issues/comments/77/attachments`);
			expect(form).toBeInstanceOf((globalThis as any).FormData);

			const file = (form as any).get('attachment');

			expect(file.name).toBe('note.txt');
			expect(file.type).toBe('text/plain');
			expect(result).toEqual({ id: 5 });
		});

		it('should fall back to a generated file name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77 },
				binary: { data: { data: Buffer.from('hello') } },
			});
			api.post.mockResolvedValue({ data: null });

			const result = await issue.addIssueCommentAttachment.call(ctx, api as any, 0);
			const form = api.post.mock.calls[0][1];
			const file = (form as any).get('attachment');

			expect(file.name).toBe('attachment-77');
			expect(result).toEqual({ success: true });
		});

		it('should surface a missing binary property', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77, binaryProperty: 'upload' },
			});

			await expect(issue.addIssueCommentAttachment.call(ctx, api as any, 0)).rejects.toThrow(
				'No binary data property "upload"'
			);
		});
	});

	describe('deleteIssueCommentAttachment', () => {
		it('should DELETE the attachment', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77, attachmentId: 5 },
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			const result = await issue.deleteIssueCommentAttachment.call(ctx, api as any, 0);

			expect(api.delete).toHaveBeenCalledWith(`${BASE}/issues/comments/77/attachments/5`);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77, attachmentId: 5 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await issue.deleteIssueCommentAttachment.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require an attachment ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, commentId: 77 },
			});

			await expect(issue.deleteIssueCommentAttachment.call(ctx, api as any, 0)).rejects.toThrow(
				'Attachment ID is required'
			);
		});
	});
});
