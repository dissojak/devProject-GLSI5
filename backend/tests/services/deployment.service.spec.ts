import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';

import {
  Analysis,
  Deployment,
  DeploymentPlan,
  Project,
  User,
  type AnalysisDocument,
  type DeploymentDocument,
  type DeploymentPlanDocument,
  type ProjectDocument,
  type UserDocument,
} from '../../src/models/entities/index.js';
import {
  AuditLogRepository,
  DeploymentRepository,
  PlanRepository,
  ProjectRepository,
} from '../../src/repositories/index.js';
import { InvalidStateTransitionError, NotFoundError } from '../../src/domain/errors/index.js';
import { createDeploymentService } from '../../src/services/deployments/deployment.service.js';
import { connectTestingModule, disconnectTestingModule } from '../integration/test-database.js';

const COMPONENT = {
  name: 'api',
  type: 'BACKEND',
  containerPort: 3000,
  replicas: 2,
  resources: {
    requests: { cpu: '100m', memory: '128Mi' },
    limits: { cpu: '500m', memory: '512Mi' },
  },
  hpa: { enabled: false },
  ingress: { enabled: false, tls: false },
} as const;

let owner: UserDocument;
let stranger: UserDocument;
let project: ProjectDocument;
let analysis: AnalysisDocument;
let plan: DeploymentPlanDocument;
let deployments: DeploymentRepository;
let service: ReturnType<typeof createDeploymentService>;

async function seededDeployment(environment: 'DEVELOPMENT' | 'PRODUCTION' = 'PRODUCTION') {
  seededDeployments += 1;
  const draft = await DeploymentPlan.draft({
    projectId: project._id,
    analysisId: analysis._id,
    createdBy: owner._id,
    version: seededDeployments,
    components: [{ ...COMPONENT }],
  });
  const approved = await draft.approve(owner._id);

  return deployments.createFromPlan({
    plan: approved,
    user: owner._id,
    environment,
    gitops: { repositoryUrl: 'https://github.com/acme/repo', branch: 'main', path: 'k8s' },
  });
}

let seededDeployments = 0;

beforeAll(async () => {
  await connectTestingModule('deployment_service_test');
  await Promise.all([
    User.init(),
    Project.init(),
    Analysis.init(),
    DeploymentPlan.init(),
    Deployment.init(),
  ]);
  deployments = new DeploymentRepository();
  service = createDeploymentService(
    deployments,
    new ProjectRepository(),
    new AuditLogRepository(),
  );
});

afterAll(async () => {
  await disconnectTestingModule();
});

beforeEach(async () => {
  // The beforeEach plan holds v1; seeded deployments mint v2, v3, …
  seededDeployments = 1;
  await Promise.all([
    User.deleteMany({}).setOptions({ withDeleted: true }),
    Project.deleteMany({}).setOptions({ withDeleted: true }),
    Analysis.deleteMany({}).setOptions({ withDeleted: true }),
    DeploymentPlan.deleteMany({}).setOptions({ withDeleted: true }),
    Deployment.deleteMany({}).setOptions({ withDeleted: true }),
  ]);

  owner = await User.register({ name: 'deploy owner', email: 'owner@example.com', password: 'LongEnough1!' });
  stranger = await User.register({ name: 'deploy stranger', email: 'stranger@example.com', password: 'LongEnough1!' });
  let current = await Project.createFor({ ownerId: owner._id, name: 'deploy project', description: 'd' });
  current = await current.connectRepository({ url: 'https://github.com/acme/repo' }, 'main');
  project = await current.markRepositoryVerified('main');
  analysis = await (await Analysis.request({ project, userId: owner._id })).start();
  analysis = await analysis.complete({
    detectedFiles: ['src/index.ts'],
    docker: { hasDockerfile: true, hasCompose: false, findings: [] },
  });
  plan = await DeploymentPlan.draft({
    projectId: project._id,
    analysisId: analysis._id,
    createdBy: owner._id,
    version: 1,
    components: [{ ...COMPONENT }],
  });
});

describe('deployment service', () => {
  it('lists deployments of the owned projects only, newest first', async () => {
    const first = await seededDeployment('DEVELOPMENT');
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await seededDeployment('PRODUCTION');

    const strangerProject = await Project.createFor({
      ownerId: stranger._id,
      name: 'stranger project',
      description: 'd',
    });
    await Deployment.create({
      project: strangerProject._id,
      plan: plan._id,
      planVersion: 1,
      environment: 'STAGING',
      triggeredBy: stranger._id,
      gitops: { repositoryUrl: 'https://github.com/acme/repo', branch: 'main', path: 'k8s' },
    });

    const { items, pagination } = await service.list(String(owner._id), { page: 1, limit: 10 });

    expect(items.map((deployment) => String(deployment.id))).toEqual([
      String(second.id),
      String(first.id),
    ]);
    expect(pagination.total).toBe(2);
  });

  it('returns an empty page when the user owns no projects', async () => {
    const result = await service.list(String(stranger._id), { page: 1, limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('serves a deployment to its owner and hides foreign ones behind 404', async () => {
    const deployment = await seededDeployment();

    const found = await service.get(String(owner._id), String(deployment.id));
    expect(String(found.id)).toBe(String(deployment.id));

    await expect(
      service.get(String(stranger._id), String(deployment.id)),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('cancels a pending deployment and refuses to cancel a terminal one', async () => {
    const deployment = await seededDeployment();

    const cancelled = await service.cancel(String(owner._id), String(deployment.id));
    expect(cancelled.status).toBe('CANCELLED');

    await expect(
      service.cancel(String(owner._id), String(deployment.id)),
    ).rejects.toBeInstanceOf(InvalidStateTransitionError);
  });

  it('walks the workflow lifecycle: start, succeed, fail', async () => {
    const deployment = await seededDeployment('DEVELOPMENT');

    const started = await service.start(String(deployment.id));
    expect(started.status).toBe('IN_PROGRESS');
    expect(started.startedAt).not.toBeNull();

    const succeeded = await service.succeed(String(deployment.id));
    expect(succeeded.status).toBe('SUCCEEDED');
    expect(succeeded.finishedAt).not.toBeNull();
    expect(succeeded.durationMs).not.toBeNull();

    const failing = await seededDeployment('STAGING');
    const starting = await service.start(String(failing.id));
    const failed = await service.fail(String(starting.id), {
      code: 'ARGO_SYNC_FAILED',
      message: 'the application never synced',
    });
    expect(failed.status).toBe('FAILED');
    expect(failed.error?.code).toBe('ARGO_SYNC_FAILED');
  });

  it('records the gitops commit sha and argo application status', async () => {
    const deployment = await seededDeployment();
    const started = await service.start(String(deployment.id));

    const committed = await service.recordGitopsCommit(String(started.id), 'abc123');
    expect(committed.gitops.commitSha).toBe('abc123');

    const synced = await service.recordArgoStatus(String(committed.id), {
      applicationName: 'atlas-api',
      syncStatus: 'SYNCED',
      healthStatus: 'HEALTHY',
    });
    expect(synced.argo.applicationName).toBe('atlas-api');
    expect(synced.argo.syncStatus).toBe('SYNCED');
    expect(synced.argo.healthStatus).toBe('HEALTHY');
  });
});
