import * as artifact from './actions/artifact.operations';
import * as job from './actions/job.operations';
import * as run from './actions/run.operations';
import * as runner from './actions/runner.operations';
import * as secret from './actions/secret.operations';
import * as variable from './actions/variable.operations';
import * as workflow from './actions/workflow.operations';
import {
	createApi,
	createContext,
	repositoryLocator,
} from '../Gitverse/__testutils__/context';

const BASE = '/repos/SUSTUDIO/n8n-nodes-gitverse';

describe('CI/CD operations', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	describe('workflow', () => {
		it('should list the workflows', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 5 },
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			const result = await workflow.getWorkflows.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/workflows`, {
				params: { page: 1, per_page: 5 },
			});
			expect(result).toEqual([{ id: 1 }]);
		});

		it('should get a workflow by file name', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, workflowId: 'ci.yml' },
			});
			api.get.mockResolvedValue({ data: { id: 1 } });

			await workflow.getWorkflow.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/workflows/ci.yml`);
		});

		it('should list the runs of a workflow', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, workflowId: '1', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await workflow.getWorkflowRuns.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/workflows/1/runs`, {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should read the dispatch parameters with the branch', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, workflow: 'ci.yml', branch: 'main' },
			});
			api.get.mockResolvedValue({ data: { inputs: {} } });

			const result = await workflow.getWorkflowDispatchParameters.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/workflows/ci.yml/dispatches`, {
				params: { branch: 'main' },
			});
			expect(result).toEqual({ inputs: {} });
		});

		it('should omit the branch when it is not set', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, workflow: 'ci.yml' },
			});
			api.get.mockResolvedValue({ data: {} });

			await workflow.getWorkflowDispatchParameters.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/workflows/ci.yml/dispatches`, {
				params: {},
			});
		});

		it('should dispatch a workflow with its inputs', async () => {
			const ctx = createContext({
				params: {
					repository: repositoryLocator,
					workflow: 'ci.yml',
					branch: 'main',
					inputs: { environment: 'prod' },
				},
			});
			api.post.mockResolvedValue({ data: { ok: true } });

			const result = await workflow.dispatchWorkflow.call(ctx, api as any, 0);

			expect(api.post).toHaveBeenCalledWith(
				`${BASE}/actions/workflows/ci.yml/dispatches`,
				{ environment: 'prod' },
				{ params: { branch: 'main' } }
			);
			expect(result).toEqual({ ok: true });
		});

		it('should fall back to a success marker when dispatching', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, workflow: 'ci.yml' },
			});
			api.post.mockResolvedValue({ data: null });

			expect(await workflow.dispatchWorkflow.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should require the workflow file', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(workflow.dispatchWorkflow.call(ctx, api as any, 0)).rejects.toThrow(
				'Workflow file is required'
			);
		});
	});

	describe('run', () => {
		it('should list the runs', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 2 },
			});
			api.get.mockResolvedValue({ data: [{ id: 12 }] });

			await run.getRuns.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runs`, {
				params: { page: 1, per_page: 2 },
			});
		});

		it('should get a run by ID', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runId: 12 },
			});
			api.get.mockResolvedValue({ data: { id: 12 } });

			expect(await run.getRun.call(ctx, api as any, 0)).toEqual({ id: 12 });
			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runs/12`);
		});

		it('should list the jobs of a run', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runId: 12, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await run.getRunJobs.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runs/12/jobs`, {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should get a run by index', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runIndex: 3 },
			});
			api.get.mockResolvedValue({ data: { index: 3 } });

			await run.getRunByIndex.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runs/index/3`);
		});

		it('should list the jobs of a run by index', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runIndex: 3, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await run.getRunJobsByIndex.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runs/index/3/jobs`, {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should cancel a run', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runId: 12 },
			});
			api.post.mockResolvedValue({ data: { ok: true } });

			expect(await run.cancelRun.call(ctx, api as any, 0)).toEqual({ ok: true });
			expect(api.post).toHaveBeenCalledWith(`${BASE}/actions/runs/12/cancel`);
		});

		it('should rerun a run and fall back to a success marker', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, runId: 12 },
			});
			api.post.mockResolvedValue({ data: null });

			expect(await run.rerunRun.call(ctx, api as any, 0)).toEqual({ success: true });
			expect(api.post).toHaveBeenCalledWith(`${BASE}/actions/runs/12/rerun`);
		});

		it('should require the run ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(run.getRun.call(ctx, api as any, 0)).rejects.toThrow(
				'Run ID is required'
			);
		});
	});

	describe('job', () => {
		it('should get a job', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, jobId: 5 } });
			api.get.mockResolvedValue({ data: { id: 5 } });

			expect(await job.getJob.call(ctx, api as any, 0)).toEqual({ id: 5 });
			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/jobs/5`);
		});

		it('should wrap plain text logs', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, jobId: 5 } });
			api.get.mockResolvedValue({ data: 'line one\nline two' });

			expect(await job.getJobLogs.call(ctx, api as any, 0)).toEqual({
				logs: 'line one\nline two',
			});
			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/jobs/5/logs`);
		});

		it('should keep a structured log response', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, jobId: 5 } });
			api.get.mockResolvedValue({ data: { logs: 'already structured' } });

			expect(await job.getJobLogs.call(ctx, api as any, 0)).toEqual({
				logs: 'already structured',
			});
		});

		it('should rerun a job', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator, jobId: 5 } });
			api.post.mockResolvedValue({ data: null });

			expect(await job.rerunJob.call(ctx, api as any, 0)).toEqual({ success: true });
			expect(api.post).toHaveBeenCalledWith(`${BASE}/actions/jobs/5/rerun`);
		});

		it('should require the job ID', async () => {
			const ctx = createContext({ params: { repository: repositoryLocator } });

			await expect(job.getJob.call(ctx, api as any, 0)).rejects.toThrow('Job ID is required');
		});
	});

	describe('variable', () => {
		it('should list the variables of a repository', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					returnAll: true,
				},
			});
			api.get.mockResolvedValue({ data: [{ name: 'A' }] });

			const result = await variable.getVariables.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/variables`, {
				params: { page: 1, per_page: 50 },
			});
			expect(result).toEqual([{ name: 'A' }]);
		});

		it('should list the variables of an organization', async () => {
			const ctx = createContext({
				params: { scope: 'organization', organization: 'my-org', returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await variable.getVariables.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith('/orgs/my-org/actions/variables', {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should create a variable', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					variableName: 'MY_VAR',
					variableValue: 'value',
				},
			});
			api.post.mockResolvedValue({ data: { name: 'MY_VAR' } });

			expect(await variable.createVariable.call(ctx, api as any, 0)).toEqual({
				name: 'MY_VAR',
			});
			expect(api.post).toHaveBeenCalledWith(`${BASE}/actions/variables`, {
				name: 'MY_VAR',
				value: 'value',
			});
		});

		it('should get a variable by name', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					variableName: 'MY VAR',
				},
			});
			api.get.mockResolvedValue({ data: { name: 'MY VAR' } });

			await variable.getVariable.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/variables/MY%20VAR`);
		});

		it('should update a variable', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					variableName: 'MY_VAR',
					variableValue: 'new',
				},
			});
			api.patch.mockResolvedValue({ data: null });

			expect(await variable.updateVariable.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
			expect(api.patch).toHaveBeenCalledWith(`${BASE}/actions/variables/MY_VAR`, {
				name: 'MY_VAR',
				value: 'new',
			});
		});

		it('should delete a variable', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					variableName: 'MY_VAR',
				},
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await variable.deleteVariable.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/actions/variables/MY_VAR`);
		});

		it('should require the organization when the scope is an organization', async () => {
			const ctx = createContext({ params: { scope: 'organization' } });

			await expect(variable.getVariables.call(ctx, api as any, 0)).rejects.toThrow(
				'Organization is required'
			);
		});

		it('should require the variable name', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator },
			});

			await expect(variable.getVariable.call(ctx, api as any, 0)).rejects.toThrow(
				'Variable name is required'
			);
		});
	});

	describe('secret', () => {
		it('should list the secrets', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [{ name: 'TOKEN' }] });

			await secret.getSecrets.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/secrets`, {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should get a secret', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					secretName: 'TOKEN',
				},
			});
			api.get.mockResolvedValue({ data: { name: 'TOKEN' } });

			expect(await secret.getSecret.call(ctx, api as any, 0)).toEqual({ name: 'TOKEN' });
			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/secrets/TOKEN`);
		});

		it('should send the secret value as a query parameter', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					secretName: 'TOKEN',
					secretValue: 's3cr3t',
				},
			});
			api.put.mockResolvedValue({ data: null });

			expect(await secret.upsertSecret.call(ctx, api as any, 0)).toEqual({ success: true });
			expect(api.put).toHaveBeenCalledWith(`${BASE}/actions/secrets/TOKEN`, null, {
				params: { value: 's3cr3t' },
			});
		});

		it('should delete a secret', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					secretName: 'TOKEN',
				},
			});
			api.delete.mockResolvedValue({ data: { ok: true } });

			expect(await secret.deleteSecret.call(ctx, api as any, 0)).toEqual({ ok: true });
		});

		it('should require the secret value', async () => {
			const ctx = createContext({
				params: {
					scope: 'repository',
					repository: repositoryLocator,
					secretName: 'TOKEN',
				},
			});

			await expect(secret.upsertSecret.call(ctx, api as any, 0)).rejects.toThrow(
				'Secret value is required'
			);
		});
	});

	describe('runner', () => {
		it('should list the runners', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator, returnAll: true },
			});
			api.get.mockResolvedValue({ data: [] });

			await runner.getRunners.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runners`, {
				params: { page: 1, per_page: 50 },
			});
		});

		it('should create a registration token', async () => {
			const ctx = createContext({
				params: { scope: 'organization', organization: 'my-org' },
			});
			api.post.mockResolvedValue({ data: { token: 'abc' } });

			expect(await runner.createRunnerRegistrationToken.call(ctx, api as any, 0)).toEqual({
				token: 'abc',
			});
			expect(api.post).toHaveBeenCalledWith('/orgs/my-org/actions/runners/registration-token');
		});

		it('should fall back to a success marker for the token', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator },
			});
			api.post.mockResolvedValue({ data: null });

			expect(await runner.createRunnerRegistrationToken.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});

		it('should get a runner', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator, runnerId: 7 },
			});
			api.get.mockResolvedValue({ data: { id: 7 } });

			await runner.getRunner.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/runners/7`);
		});

		it('should delete a runner', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator, runnerId: 7 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await runner.deleteRunner.call(ctx, api as any, 0)).toEqual({ success: true });
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/actions/runners/7`);
		});

		it('should require the runner ID', async () => {
			const ctx = createContext({
				params: { scope: 'repository', repository: repositoryLocator },
			});

			await expect(runner.getRunner.call(ctx, api as any, 0)).rejects.toThrow(
				'Runner ID is required'
			);
		});
	});

	describe('artifact', () => {
		it('should list the artifacts', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, returnAll: false, limit: 4 },
			});
			api.get.mockResolvedValue({ data: [{ id: 1 }] });

			await artifact.getArtifacts.call(ctx, api as any, 0);

			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/artifacts`, {
				params: { page: 1, per_page: 4 },
			});
		});

		it('should get an artifact', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, artifactId: 1 },
			});
			api.get.mockResolvedValue({ data: { id: 1 } });

			expect(await artifact.getArtifact.call(ctx, api as any, 0)).toEqual({ id: 1 });
		});

		it('should delete an artifact', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, artifactId: 1 },
			});
			api.delete.mockResolvedValue({ data: null });

			expect(await artifact.deleteArtifact.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
			expect(api.delete).toHaveBeenCalledWith(`${BASE}/actions/artifacts/1`);
		});

		it('should report the download URL of a redirect', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, artifactId: 1 },
			});
			api.get.mockResolvedValue({
				status: 302,
				headers: { location: 'https://storage.example.com/artifact.zip' },
				data: '',
			});

			const result = await artifact.getArtifactDownloadUrl.call(ctx, api as any, 0);

			expect(result).toEqual({
				download_url: 'https://storage.example.com/artifact.zip',
				status: 302,
			});
			expect(api.get).toHaveBeenCalledWith(`${BASE}/actions/artifacts/1/zip`, {
				maxRedirects: 0,
				validateStatus: expect.any(Function),
			});
		});

		it('should return the payload when the API answers directly', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, artifactId: 1 },
			});
			api.get.mockResolvedValue({ status: 200, headers: {}, data: { url: 'direct' } });

			expect(await artifact.getArtifactDownloadUrl.call(ctx, api as any, 0)).toEqual({
				url: 'direct',
			});
		});

		it('should fall back to a success marker without a payload', async () => {
			const ctx = createContext({
				params: { repository: repositoryLocator, artifactId: 1 },
			});
			api.get.mockResolvedValue({ status: 204, headers: {}, data: null });

			expect(await artifact.getArtifactDownloadUrl.call(ctx, api as any, 0)).toEqual({
				success: true,
			});
		});
	});
});

describe('CI/CD empty responses', () => {
	let api: ReturnType<typeof createApi>;

	beforeEach(() => {
		api = createApi();
	});

	it('should fall back to a success marker for the cancelling and the settings writes', async () => {
		api.post.mockResolvedValue({ data: null });
		api.put.mockResolvedValue({ data: null });
		api.patch.mockResolvedValue({ data: null });
		api.delete.mockResolvedValue({ data: null });

		expect(
			await run.cancelRun.call(
				createContext({ params: { repository: repositoryLocator, runId: 12 } }),
				api as any,
				0
			)
		).toEqual({ success: true });

		expect(
			await job.rerunJob.call(
				createContext({ params: { repository: repositoryLocator, jobId: 5 } }),
				api as any,
				0
			)
		).toEqual({ success: true });
	});

	it('should fall back to a success marker for the settings and artifact writes', async () => {
		api.post.mockResolvedValue({ data: null });
		api.put.mockResolvedValue({ data: null });
		api.patch.mockResolvedValue({ data: null });
		api.delete.mockResolvedValue({ data: null });

		expect(
			await variable.createVariable.call(
				createContext({
					params: {
						scope: 'repository',
						repository: repositoryLocator,
						variableName: 'A',
						variableValue: 'b',
					},
				}),
				api as any,
				0
			)
		).toEqual({ success: true });

		expect(
			await secret.upsertSecret.call(
				createContext({
					params: {
						scope: 'repository',
						repository: repositoryLocator,
						secretName: 'A',
						secretValue: 'b',
					},
				}),
				api as any,
				0
			)
		).toEqual({ success: true });

		expect(
			await runner.deleteRunner.call(
				createContext({
					params: { scope: 'repository', repository: repositoryLocator, runnerId: 1 },
				}),
				api as any,
				0
			)
		).toEqual({ success: true });

		expect(
			await artifact.deleteArtifact.call(
				createContext({ params: { repository: repositoryLocator, artifactId: 1 } }),
				api as any,
				0
			)
		).toEqual({ success: true });
	});
});
