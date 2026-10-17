import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import {
	cicdPagination,
	organizationProperty,
	scopedRepositoryProperty,
	scopeProperty,
} from './shared';

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

const workflowOps: INodePropertyOptions[] = [
	{
		name: 'Dispatch',
		value: 'dispatch',
		description: 'Trigger a workflow manually',
		action: 'Dispatch a workflow',
		displayOptions: { show: { resource: ['workflow'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a workflow by its ID or file name',
		action: 'Get a workflow',
		displayOptions: { show: { resource: ['workflow'] } },
	},
	{
		name: 'Get Dispatch Parameters',
		value: 'getDispatches',
		description: 'List the inputs a workflow expects when it is dispatched',
		action: 'Get the dispatch parameters of a workflow',
		displayOptions: { show: { resource: ['workflow'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the workflows of a repository',
		action: 'Get many workflows',
		displayOptions: { show: { resource: ['workflow'] } },
	},
	{
		name: 'Get Runs',
		value: 'getRuns',
		description: 'List the runs of a workflow',
		action: 'Get the runs of a workflow',
		displayOptions: { show: { resource: ['workflow'] } },
	},
];

const runOps: INodePropertyOptions[] = [
	{
		name: 'Cancel',
		value: 'cancel',
		description: 'Cancel an active run',
		action: 'Cancel a run',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a run by its ID',
		action: 'Get a run',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Get by Index',
		value: 'getByIndex',
		description: 'Get a run by its index inside the repository',
		action: 'Get a run by index',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Get Jobs',
		value: 'getJobs',
		description: 'List the jobs of a run',
		action: 'Get the jobs of a run',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Get Jobs by Index',
		value: 'getJobsByIndex',
		description: 'List the jobs of a run selected by index',
		action: 'Get the jobs of a run by index',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the runs of a repository',
		action: 'Get many runs',
		displayOptions: { show: { resource: ['run'] } },
	},
	{
		name: 'Rerun',
		value: 'rerun',
		description: 'Start a finished run again',
		action: 'Rerun a run',
		displayOptions: { show: { resource: ['run'] } },
	},
];

const jobOps: INodePropertyOptions[] = [
	{
		name: 'Get',
		value: 'get',
		description: 'Get a job by its ID',
		action: 'Get a job',
		displayOptions: { show: { resource: ['job'] } },
	},
	{
		name: 'Get Logs',
		value: 'getLogs',
		description: 'Get the logs of a job as text',
		action: 'Get the logs of a job',
		displayOptions: { show: { resource: ['job'] } },
	},
	{
		name: 'Rerun',
		value: 'rerun',
		description: 'Start a single job again',
		action: 'Rerun a job',
		displayOptions: { show: { resource: ['job'] } },
	},
];

const variableOps: INodePropertyOptions[] = [
	{
		name: 'Create',
		value: 'create',
		description: 'Create a CI/CD variable',
		action: 'Create a variable',
		displayOptions: { show: { resource: ['variable'] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a CI/CD variable',
		action: 'Delete a variable',
		displayOptions: { show: { resource: ['variable'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a CI/CD variable by its name',
		action: 'Get a variable',
		displayOptions: { show: { resource: ['variable'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the CI/CD variables',
		action: 'Get many variables',
		displayOptions: { show: { resource: ['variable'] } },
	},
	{
		name: 'Update',
		value: 'update',
		description: 'Update the value of a CI/CD variable',
		action: 'Update a variable',
		displayOptions: { show: { resource: ['variable'] } },
	},
];

const secretOps: INodePropertyOptions[] = [
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a CI/CD secret',
		action: 'Delete a secret',
		displayOptions: { show: { resource: ['secret'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get the metadata of a CI/CD secret',
		action: 'Get a secret',
		displayOptions: { show: { resource: ['secret'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the CI/CD secrets',
		action: 'Get many secrets',
		displayOptions: { show: { resource: ['secret'] } },
	},
	{
		name: 'Set',
		value: 'upsert',
		description: 'Create a secret or replace its value',
		action: 'Set a secret',
		displayOptions: { show: { resource: ['secret'] } },
	},
];

const runnerOps: INodePropertyOptions[] = [
	{
		name: 'Create Registration Token',
		value: 'createRegistrationToken',
		description: 'Create a token to register a self-hosted runner',
		action: 'Create a runner registration token',
		displayOptions: { show: { resource: ['runner'] } },
	},
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete a self-hosted runner',
		action: 'Delete a runner',
		displayOptions: { show: { resource: ['runner'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get a self-hosted runner by its ID',
		action: 'Get a runner',
		displayOptions: { show: { resource: ['runner'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the self-hosted runners',
		action: 'Get many runners',
		displayOptions: { show: { resource: ['runner'] } },
	},
];

const artifactOps: INodePropertyOptions[] = [
	{
		name: 'Delete',
		value: 'delete',
		description: 'Delete an artifact',
		action: 'Delete an artifact',
		displayOptions: { show: { resource: ['artifact'] } },
	},
	{
		name: 'Get',
		value: 'get',
		description: 'Get an artifact by its ID',
		action: 'Get an artifact',
		displayOptions: { show: { resource: ['artifact'] } },
	},
	{
		name: 'Get Download URL',
		value: 'download',
		description: 'Get the URL the artifact is downloaded from',
		action: 'Get the download URL of an artifact',
		displayOptions: { show: { resource: ['artifact'] } },
	},
	{
		name: 'Get Many',
		value: 'getAll',
		description: 'List the artifacts of a repository',
		action: 'Get many artifacts',
		displayOptions: { show: { resource: ['artifact'] } },
	},
];

export const cicdResources: INodePropertyOptions[] = [
	{ name: 'Artifact', value: 'artifact' },
	{ name: 'Job', value: 'job' },
	{ name: 'Run', value: 'run' },
	{ name: 'Runner', value: 'runner' },
	{ name: 'Secret', value: 'secret' },
	{ name: 'Variable', value: 'variable' },
	{ name: 'Workflow', value: 'workflow' },
];

export const cicdOperations: INodePropertyOptions[] = [
	...workflowOps,
	...runOps,
	...jobOps,
	...variableOps,
	...secretOps,
	...runnerOps,
	...artifactOps,
];

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

const workflowFields: INodeProperties[] = [
	scopedRepositoryProperty('workflow'),
	{
		displayName: 'Workflow',
		name: 'workflow',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ci.yml',
		description: 'File name or ID of the workflow',
		displayOptions: {
			show: { resource: ['workflow'], operation: ['getDispatches', 'dispatch'] },
		},
	},
	{
		displayName: 'Workflow ID',
		name: 'workflowId',
		type: 'string',
		required: true,
		default: '',
		description: 'Numeric ID or file name of the workflow',
		displayOptions: {
			show: { resource: ['workflow'], operation: ['get', 'getRuns'] },
		},
	},
	{
		displayName: 'Branch',
		name: 'branch',
		type: 'string',
		default: '',
		placeholder: 'main',
		description: 'Branch or tag the workflow is dispatched on',
		displayOptions: {
			show: { resource: ['workflow'], operation: ['getDispatches', 'dispatch'] },
		},
	},
	{
		displayName: 'Inputs',
		name: 'inputs',
		type: 'json',
		default: {},
		description: 'Inputs of the workflow as a flat JSON object',
		displayOptions: { show: { resource: ['workflow'], operation: ['dispatch'] } },
	},
	...cicdPagination('workflow', ['getAll', 'getRuns']),
];

const runFields: INodeProperties[] = [
	scopedRepositoryProperty('run'),
	{
		displayName: 'Run ID',
		name: 'runId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the run',
		displayOptions: {
			show: { resource: ['run'], operation: ['get', 'getJobs', 'cancel', 'rerun'] },
		},
	},
	{
		displayName: 'Run Index',
		name: 'runIndex',
		type: 'number',
		required: true,
		default: 0,
		description: 'Index of the run inside the repository',
		displayOptions: {
			show: { resource: ['run'], operation: ['getByIndex', 'getJobsByIndex'] },
		},
	},
	...cicdPagination('run', ['getAll', 'getJobs', 'getJobsByIndex']),
];

const jobFields: INodeProperties[] = [
	scopedRepositoryProperty('job'),
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the job',
		displayOptions: { show: { resource: ['job'] } },
	},
];

const variableFields: INodeProperties[] = [
	scopeProperty('variable'),
	scopedRepositoryProperty('variable'),
	organizationProperty('variable'),
	{
		displayName: 'Name',
		name: 'variableName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MY_VARIABLE',
		description: 'Name of the variable',
		displayOptions: { show: { resource: ['variable'] } },
	},
	{
		displayName: 'Value',
		name: 'variableValue',
		type: 'string',
		required: true,
		default: '',
		description: 'Value of the variable',
		displayOptions: {
			show: { resource: ['variable'], operation: ['create', 'update'] },
		},
	},
	...cicdPagination('variable', ['getAll']),
];

const secretFields: INodeProperties[] = [
	scopeProperty('secret'),
	scopedRepositoryProperty('secret'),
	organizationProperty('secret'),
	{
		displayName: 'Name',
		name: 'secretName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MY_SECRET',
		description: 'Name of the secret',
		displayOptions: { show: { resource: ['secret'] } },
	},
	{
		displayName: 'Value',
		name: 'secretValue',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		description: 'Value of the secret, sent as a query parameter as the API requires',
		displayOptions: { show: { resource: ['secret'], operation: ['upsert'] } },
	},
	...cicdPagination('secret', ['getAll']),
];

const runnerFields: INodeProperties[] = [
	scopeProperty('runner'),
	scopedRepositoryProperty('runner'),
	organizationProperty('runner'),
	{
		displayName: 'Runner ID',
		name: 'runnerId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the runner',
		displayOptions: { show: { resource: ['runner'], operation: ['get', 'delete'] } },
	},
	...cicdPagination('runner', ['getAll']),
];

const artifactFields: INodeProperties[] = [
	scopedRepositoryProperty('artifact'),
	{
		displayName: 'Artifact ID',
		name: 'artifactId',
		type: 'number',
		required: true,
		default: 0,
		description: 'Numeric ID of the artifact',
		displayOptions: {
			show: { resource: ['artifact'], operation: ['get', 'delete', 'download'] },
		},
	},
	...cicdPagination('artifact', ['getAll']),
];

export const cicdFields: INodeProperties[] = [
	...workflowFields,
	...runFields,
	...jobFields,
	...variableFields,
	...secretFields,
	...runnerFields,
	...artifactFields,
];
