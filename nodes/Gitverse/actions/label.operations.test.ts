import * as label from './label.operations';
import { createApi, createContext, repositoryLocator } from '../__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('label operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('getManyLabels', () => {
		it('should list the labels using the limit parameter', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 4 },
			});
			api.get.mockResolvedValue({ data: [{ name: 'bug' }] });

			const result = await label.getManyLabels.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/labels`, {
				params: { page: 1, limit: 4 },
			});
			expect(result).toEqual([{ name: 'bug' }]);
		});

		it('should pass the sort field and follow every page', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, sort: 'name', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await label.getManyLabels.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/labels`, {
				params: { sort: 'name', page: 1, limit: 50 },
			});
		});
	});

	describe('getLabel', () => {
		it('should GET a label by name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, label: 'needs review' },
			});
			api.get.mockResolvedValue({ data: { name: 'needs review' } });

			const result = await label.getLabel.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/labels/needs%20review`);
			expect(result).toEqual({ name: 'needs review' });
		});

		it('should require the label name', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(label.getLabel.call(ctx, api as any, 0)).rejects.toThrow(
				'Label name is required'
			);
		});
	});

	describe('createLabel', () => {
		it('should POST the label without the leading # of the colour', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					label: 'bug',
					color: '#D73A4A',
					labelDescription: 'Something is broken',
					exclusive: true,
				},
			});
			api.post.mockResolvedValue({ data: { name: 'bug' } });

			const result = await label.createLabel.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/labels`, {
				name: 'bug',
				color: 'D73A4A',
				description: 'Something is broken',
				exclusive: true,
			});
			expect(result).toEqual({ name: 'bug' });
		});

		it('should fall back to the default colour and keep a bare hex value', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					label: 'chore',
					color: '00FF00',
					labelDescription: '',
					exclusive: false,
				},
			});
			api.post.mockResolvedValue({ data: {} });

			await label.createLabel.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/labels`, {
				name: 'chore',
				color: '00FF00',
				description: '',
			});
		});

		it('should use the default colour when none is given', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, label: 'chore' },
			});
			api.post.mockResolvedValue({ data: {} });

			await label.createLabel.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(`${BASE}/labels`, {
				name: 'chore',
				color: 'ededed',
				description: '',
			});
		});

		it('should require the label name', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(label.createLabel.call(ctx, api as any, 0)).rejects.toThrow(
				'Label name is required'
			);
		});
	});

	describe('updateLabel', () => {
		it('should PATCH every provided field', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					label: 'bug',
					updateFields: {
						name: 'defect',
						color: '#123456',
						labelDescription: 'Still broken',
						exclusive: true,
					},
				},
			});
			api.patch.mockResolvedValue({ data: { name: 'defect' } });

			await label.updateLabel.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/labels/bug`, {
				name: 'defect',
				color: '123456',
				description: 'Still broken',
				exclusive: true,
			});
		});

		it('should send an empty body when no field is set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, label: 'bug', updateFields: {} },
			});
			api.patch.mockResolvedValue({ data: {} });

			await label.updateLabel.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/labels/bug`, {});
		});

		it('should treat a missing colour as an empty string', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					label: 'bug',
					updateFields: { color: null },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await label.updateLabel.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/labels/bug`, { color: '' });
		});

		it('should encode an unusual label name', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					label: 'needs/review',
					updateFields: { color: 'AA0000' },
				},
			});
			api.patch.mockResolvedValue({ data: {} });

			await label.updateLabel.call(ctx, api as any, 0);

			expect(api.patch).toHaveBeenCalledWith(`${BASE}/labels/needs/review`, {
				color: 'AA0000',
			});
		});

		it('should require the label name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, updateFields: { color: 'AA0000' } },
			});

			await expect(label.updateLabel.call(ctx, api as any, 0)).rejects.toThrow(
				'Label name is required'
			);
		});
	});
});
