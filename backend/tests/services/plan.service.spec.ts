import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';

import {
  Analysis,
  DeploymentPlan,
  Project,
  User,
  type AnalysisDocument,
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
import {
  InvariantViolationError,
  InvalidStateTransitionError,
  NotFoundError,
} from '../../src/domain/errors/index.js';
import { createPlanService } from '../../src/services/plans/plan.service.js';
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
let plans: PlanRepository;
let service: ReturnType<typeof createPlanService>;

async function seededPlan(version: number): Promise<DeploymentPlanDocument> {
  return DeploymentPlan.draft({
    projectId: project._id,
    analysisId: analysis._id,
    createdBy: owner._id,
    version,
    components: [{ ...COMPONENT, name: `api-${version}` }],
  });
}

beforeAll(async () => {
  await connectTestingModule('plan_service_test');
  await Promise.all([User.init(), Project.init(), Analysis.init(), DeploymentPlan.init()]);
  plans = new PlanRepository();
  service = createPlanService(
    plans,
    new ProjectRepository(),
    new DeploymentRepository(),
    new AuditLogRepository(),
  );
});

afterAll(async () => {
  await disconnectTestingModule();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}).setOptions({ withDeleted: true }),
    Project.deleteMany({}).setOptions({ withDeleted: true }),
    Analysis.deleteMany({}).setOptions({ withDeleted: true }),
    DeploymentPlan.deleteMany({}).setOptions({ withDeleted: true }),
  ]);

  owner = await User.register({ name: 'plan owner', email: 'owner@example.com', password: 'LongEnough1!' });
  stranger = await User.register({ name: 'plan stranger', email: 'stranger@example.com', password: 'LongEnough1!' });
  let current = await Project.createFor({ ownerId: owner._id, name: 'plan project', description: 'd' });
  current = await current.connectRepository({ url: 'https://github.com/acme/repo' }, 'main');
  project = await current.markRepositoryVerified('main');
  analysis = await (await Analysis.request({ project, userId: owner._id })).start();
  analysis = await analysis.complete({
    detectedFiles: ['src/index.ts'],
    docker: { hasDockerfile: true, hasCompose: false, findings: [] },
  });
});

describe('plan service', () => {
  it('lists plans of the owned projects only, newest first', async () => {
    const mine = await seededPlan(1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await seededPlan(2);

    const strangerProject = await Project.createFor({
      ownerId: stranger._id,
      name: 'stranger project',
      description: 'd',
    });
    await DeploymentPlan.draft({
      projectId: strangerProject._id,
      analysisId: analysis._id,
      createdBy: stranger._id,
      version: 1,
      components: [{ ...COMPONENT, name: 'api' }],
    });

    const { items, pagination } = await service.list(String(owner._id), { page: 1, limit: 10 });

    expect(items.map((plan) => plan.version)).toEqual([2, 1]);
    expect(items.map((plan) => String(plan.id))).toContain(String(mine.id));
    expect(pagination.total).toBe(2);
    expect(pagination.pageCount).toBe(1);
  });

  it('returns an empty page when the user owns no projects', async () => {
    const result = await service.list(String(stranger._id), { page: 1, limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('serves a plan to its owner and hides foreign plans behind 404', async () => {
    const plan = await seededPlan(1);

    const found = await service.get(String(owner._id), String(plan.id));
    expect(String(found.id)).toBe(String(plan.id));

    await expect(service.get(String(stranger._id), String(plan.id))).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('approves a draft, stamps the review and refuses re-approval', async () => {
    const plan = await seededPlan(1);

    const approved = await service.approve(String(owner._id), String(plan.id));
    expect(approved.status).toBe('APPROVED');
    expect(String(approved.review?.decidedBy)).toBe(String(owner._id));

    await expect(service.approve(String(owner._id), String(plan.id))).rejects.toBeInstanceOf(
      InvalidStateTransitionError,
    );
  });

  it('rejects a draft with the required reason', async () => {
    const plan = await seededPlan(1);

    const rejected = await service.reject(String(owner._id), String(plan.id), {
      reason: 'replicas are too low',
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.review?.reason).toBe('replicas are too low');
  });

  it('supersedes an approved source and mints the next draft revision', async () => {
    const plan = await (await seededPlan(1)).approve(owner._id);

    const revision = await service.revise(String(owner._id), String(plan.id));

    expect(revision.status).toBe('DRAFT');
    expect(revision.version).toBe(2);
    expect(String(revision.previousPlan)).toBe(String(plan.id));
    expect(revision.components[0]?.name).toBe('api-1');

    const refreshed = await plans.findById(String(plan.id));
    expect(refreshed?.status).toBe('SUPERSEDED');
  });

  it('deploys an approved plan into a pending deployment with derived gitops', async () => {
    const plan = await (await seededPlan(1)).approve(owner._id);

    const deployment = await service.deploy(String(owner._id), String(plan.id), 'PRODUCTION');

    expect(deployment.status).toBe('PENDING');
    expect(deployment.environment).toBe('PRODUCTION');
    expect(deployment.planVersion).toBe(1);
    expect(deployment.gitops.repositoryUrl).toBe('https://github.com/acme/repo');
    expect(deployment.gitops.branch).toBe('main');
    expect(deployment.gitops.path).toBe('k8s');
  });

  it('refuses to deploy a plan that is not approved', async () => {
    const plan = await seededPlan(1);

    await expect(
      service.deploy(String(owner._id), String(plan.id), 'STAGING'),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });
});
