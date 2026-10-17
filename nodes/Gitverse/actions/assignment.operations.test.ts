import * as assignment from './assignment.operations';
import { createApi, createContext } from '../__testutils__/context';

describe('assignment operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	it('should GET a Smartclass assignment', async () => {
		const ctx = createContext({ params: { assignmentId: 560 } });
		api.get.mockResolvedValue({ data: { id: 560 } });

		const result = await assignment.getAssignment.call(ctx, api as any, 0);

		expect(api.get).toHaveBeenCalledWith('/assignments/560');
		expect(result).toEqual({ id: 560 });
	});

	it('should require the assignment ID', async () => {
		const ctx = createContext();

		await expect(assignment.getAssignment.call(ctx, api as any, 0)).rejects.toThrow(
			'Assignment ID is required'
		);
	});
});
