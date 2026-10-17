import { IExecuteFunctions } from 'n8n-workflow';
import { GitverseClient } from '../../../utils/api';

import { getRequiredNumber } from '../utils/params';

/**
 * Smartclass assignments, a Gitverse feature beyond the Git API.
 */
export async function getAssignment(
	this: IExecuteFunctions,
	api: GitverseClient,
	itemIndex: number
): Promise<Record<string, any>> {
	const assignmentId = getRequiredNumber(
		this,
		itemIndex,
		'assignmentId',
		'Assignment ID is required'
	);

	const response = await api.get(`/assignments/${assignmentId}`);

	return response.data;
}
