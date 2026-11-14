import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createCicdBuildStatusService,
} from '../../src/services/cicd-monitor/cicd-build-status.service.js';

import type {
  GitHubActionsClient,
} from '../../src/services/cicd-monitor/github-actions.client.js';

import type {
  ProjectRepository,
} from '../../src/repositories/project.repository.js';

import type {
  PlanRepository,
} from '../../src/repositories/plan.repository.js';

const IMAGE = 'ghcr.io/acme/web:plan-v1';

const RUN = {
  id: 42,
  name: 'Build images',
  status: 'completed',
  conclusion: 'failure',
  html_url: 'https://github.com/acme/web/actions/runs/42',
  head_branch: 'main',
  head_sha: 'abc123',
  event: 'workflow_dispatch',
  created_at: '2026-11-14T10:00:00Z',
  updated_at: '2026-11-14T10:00:18Z',
};

const JOB = {
  id: 7,
  name: 'build-1-web',
  status: 'completed',
  conclusion: 'failure',
  html_url: 'https://github.com/acme/web/actions/runs/42/job/7',
  started_at: '2026-11-14T10:00:00Z',
  completed_at: '2026-11-14T10:00:18Z',
  steps: [
    {
      name: 'Checkout source',
      number: 2,
      status: 'completed',
      conclusion: 'success',
      started_at: '2026-11-14T10:00:01Z',
      completed_at: '2026-11-14T10:00:02Z',
    },
    {
      name: 'Build and publish build-1-web',
      number: 5,
      status: 'completed',
      conclusion: 'failure',
      started_at: '2026-11-14T10:00:10Z',
      completed_at: '2026-11-14T10:00:12Z',
    },
  ],
};

const LOG = [
  '2026-11-14T10:00:10.0000000Z ##[group]Run docker/build-push-action@v6',
  '2026-11-14T10:00:11.0000000Z #8 [build 4/6] RUN npm install',
  '2026-11-14T10:00:12.0000000Z npm error missing script: build',
  '2026-11-14T10:00:12.5000000Z ##[error]buildx failed with: ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1',
  '2026-11-14T10:00:13.0000000Z Post job cleanup.',
].join('\n');

function fixture(
  listRunJobs: GitHubActionsClient['listRunJobs'],
  getJobLog: GitHubActionsClient['getJobLog'] = async () => LOG,
) {
  const github = {
    getWorkflowContent: vi.fn().mockResolvedValue(`image: ${IMAGE}`),
    listWorkflowRuns: vi.fn().mockResolvedValue([RUN]),
    listRunJobs: vi.fn(listRunJobs),
    getJobLog: vi.fn(getJobLog),
    dispatchWorkflow: vi.fn(),
  } as unknown as GitHubActionsClient;

  const projects = {
    findByIdForOwner: vi.fn().mockResolvedValue({
      repository: {
        isValid: true,
        owner: 'acme',
        name: 'web',
        branch: 'main',
      },
    }),
  } as unknown as ProjectRepository;

  const plans = {
    findOne: vi.fn().mockResolvedValue({
      status: 'APPROVED',
      components: [{ image: IMAGE }],
      review: { decidedAt: new Date('2026-11-14T09:00:00Z') },
    }),
  } as unknown as PlanRepository;

  return {
    github,
    service: createCicdBuildStatusService(github, projects, plans),
  };
}

describe('CI/CD build status', () => {
  it('returns the jobs and steps of the latest run', async () => {
    const { github, service } = fixture(async () => [JOB]);

    const status = await service.getStatus('user', 'project', 'plan');

    expect(status.status).toBe('FAILURE');
    expect(github.listRunJobs).toHaveBeenCalledWith('acme', 'web', 42);
    expect(status.run?.jobs).toEqual([
      {
        id: 7,
        name: 'build-1-web',
        status: 'completed',
        conclusion: 'failure',
        url: JOB.html_url,
        startedAt: JOB.started_at,
        completedAt: JOB.completed_at,
        errorExcerpt: [
          { text: '#8 [build 4/6] RUN npm install', error: false },
          { text: 'npm error missing script: build', error: false },
          {
            text: 'buildx failed with: ERROR: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1',
            error: true,
          },
        ],
        steps: [
          {
            number: 2,
            name: 'Checkout source',
            status: 'completed',
            conclusion: 'success',
            startedAt: '2026-11-14T10:00:01Z',
            completedAt: '2026-11-14T10:00:02Z',
          },
          {
            number: 5,
            name: 'Build and publish build-1-web',
            status: 'completed',
            conclusion: 'failure',
            startedAt: '2026-11-14T10:00:10Z',
            completedAt: '2026-11-14T10:00:12Z',
          },
        ],
      },
    ]);
  });

  it('keeps the run status when the jobs cannot be loaded', async () => {
    const { service } = fixture(async () => {
      throw new Error('GitHub Actions API failed (502)');
    });

    const status = await service.getStatus('user', 'project', 'plan');

    expect(status.status).toBe('FAILURE');
    expect(status.run?.jobs).toEqual([]);
  });

  it('downloads a failed job log once and serves the cached excerpt afterwards', async () => {
    const { github, service } = fixture(async () => [JOB]);

    await service.getStatus('user', 'project', 'plan');
    const second = await service.getStatus('user', 'project', 'plan');

    expect(github.getJobLog).toHaveBeenCalledTimes(1);
    expect(second.run?.jobs[0]?.errorExcerpt.at(-1)?.error).toBe(true);
  });

  it('skips logs for successful jobs and survives a log download failure', async () => {
    const passed = fixture(async () => [{ ...JOB, conclusion: 'success' }]);
    const passedStatus = await passed.service.getStatus('user', 'project', 'plan');
    expect(passed.github.getJobLog).not.toHaveBeenCalled();
    expect(passedStatus.run?.jobs[0]?.errorExcerpt).toEqual([]);

    const broken = fixture(async () => [JOB], async () => {
      throw new Error('GitHub Actions API failed (500)');
    });
    const brokenStatus = await broken.service.getStatus('user', 'project', 'plan');
    expect(brokenStatus.run?.jobs[0]?.errorExcerpt).toEqual([]);
    expect(brokenStatus.run?.jobs[0]?.steps).toHaveLength(2);
  });
});
