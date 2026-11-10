import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { createApp } from '../../src/app.js';
import { createLogger } from '../../src/shared/logging/logger.js';
import { INTERNAL_SECRET_HEADER } from '../../src/shared/security/internal-auth.js';
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
  connectTestingModule,
  disconnectTestingModule,
  stopMemoryServer,
} from '../integration/test-database.js';

const DEV = { name: 'Pipe Dev', email: 'pipe-dev@example.com', password: 'strong-pass-1' };
const OTHER = { name: 'Pipe Other', email: 'pipe-other@example.com', password: 'strong-pass-1' };

let application: Express;
let token: string;
let otherToken: string;
let owner: UserDocument;
let project: ProjectDocument;
let analysis: AnalysisDocument;

const secretHeaders = { [INTERNAL_SECRET_HEADER]: process.env.N8N_SHARED_SECRET ?? '' };

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

async function seededPlan(version = 1): Promise<DeploymentPlanDocument> {
  return DeploymentPlan.draft({
    projectId: project._id,
    analysisId: analysis._id,
    createdBy: owner._id,
    version,
    components: [{ ...COMPONENT }],
  });
}

beforeAll(async () => {
  await connectTestingModule('http_pipeline_flow_test');
  await Promise.all([
    User.init(),
    Project.init(),
    Analysis.init(),
    DeploymentPlan.init(),
  ]);
  application = createApp(createLogger('warn'));

  await User.register({ ...DEV }).then((created) => created.approve());
  await User.register({ ...OTHER }).then((created) => created.approve());
  owner = (await User.findOne({ email: DEV.email }))!;

  const login = async (email: string) => {
    const res = await request(application).post('/api/v1/auth/login').send({
      email,
      password: 'strong-pass-1',
    });

    expect(res.status).toBe(200);

    return res.body.accessToken as string;
  };
  token = await login(DEV.email);
  otherToken = await login(OTHER.email);

  project = await (await Project.createFor({ ownerId: owner._id, name: 'pipe proj', description: 'd' }))
    .connectRepository({ url: 'https://github.com/acme/repo' }, 'main')
    .then((pending) => pending.markRepositoryVerified('main'));
});

afterAll(async () => {
  await disconnectTestingModule();
  await stopMemoryServer();
});

beforeEach(async () => {
  await Promise.all([
    Analysis.deleteMany({}).setOptions({ withDeleted: true }),
    DeploymentPlan.deleteMany({}).setOptions({ withDeleted: true }),
  ]);

  analysis = await (await Analysis.request({ project, userId: owner._id })).start();
  analysis = await analysis.complete({
    detectedFiles: ['src/index.ts'],
    components: [{ name: 'api', type: 'BACKEND', rootPath: '.' }],
    docker: { hasDockerfile: true, hasCompose: false, findings: [] },
  });
});

describe('pipeline flow', () => {
  it('guards the cross-project boards behind the session', async () => {
    const analyses = await request(application).get('/api/v1/analyses');
    const plans = await request(application).get('/api/v1/plans');
    const deployments = await request(application).get('/api/v1/deployments');

    expect(analyses.status).toBe(401);
    expect(plans.status).toBe(401);
    expect(deployments.status).toBe(401);
  });

  it('lists the requesting user analyses across projects with pagination', async () => {
    const res = await request(application)
      .get('/api/v1/analyses?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ status: 'COMPLETED', branch: 'main' });
    expect(res.body.pagination).toMatchObject({ page: 1, total: 1, pageCount: 1 });

    const stranger = await request(application)
      .get('/api/v1/analyses')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(stranger.body.data).toHaveLength(0);
  });

  it('rejects malformed pagination and plan ids with 400', async () => {
    const badQuery = await request(application)
      .get('/api/v1/analyses?page=0')
      .set('Authorization', `Bearer ${token}`);
    const badPlan = await request(application)
      .get('/api/v1/plans/zzz')
      .set('Authorization', `Bearer ${token}`);

    expect(badQuery.status).toBe(400);
    expect(badPlan.status).toBe(400);
  });

  it('walks the plan lifecycle: list, approve, deploy, supersede via revision', async () => {
    const plan = await seededPlan();

    const listEmptyForOther = await request(application)
      .get('/api/v1/plans')
      .set('Authorization', `Bearer ${otherToken}`);
    expect(listEmptyForOther.body.data).toHaveLength(0);

    const listed = await request(application)
      .get('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data[0]).toMatchObject({ status: 'DRAFT', version: 1 });

    const deployDraft = await request(application)
      .post(`/api/v1/plans/${plan.id}/deployments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ environment: 'PRODUCTION' });
    expect(deployDraft.status).toBe(422);

    const approved = await request(application)
      .post(`/api/v1/plans/${plan.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe('APPROVED');

    const reApprove = await request(application)
      .post(`/api/v1/plans/${plan.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(reApprove.status).toBe(409);

    const deployed = await request(application)
      .post(`/api/v1/plans/${plan.id}/deployments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ environment: 'PRODUCTION' });
    expect(deployed.status).toBe(201);
    expect(deployed.body.data).toMatchObject({
      status: 'PENDING',
      environment: 'PRODUCTION',
      planVersion: 1,
    });

    const revision = await request(application)
      .post(`/api/v1/plans/${plan.id}/revisions`)
      .set('Authorization', `Bearer ${token}`);
    expect(revision.status).toBe(201);
    expect(revision.body.data).toMatchObject({ status: 'DRAFT', version: 2 });

    const supersededSource = await request(application)
      .get(`/api/v1/plans/${plan.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(supersededSource.body.data.status).toBe('SUPERSEDED');
  });

  it('drafts plan v1 from a completed analysis over HTTP', async () => {
    const created = await request(application)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: String(project._id), analysisId: String(analysis._id) });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ status: 'DRAFT', version: 1 });
    expect(created.body.data.components[0]).toMatchObject({
      name: 'api',
      containerPort: 3000,
      replicas: 2,
    });

    const listed = await request(application)
      .get('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data[0]).toMatchObject({ status: 'DRAFT', version: 1 });

    const again = await request(application)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: String(project._id), analysisId: String(analysis._id) });
    expect(again.status).toBe(201);
    expect(again.body.data.version).toBe(2);
  });

  it('refuses drafts from a pending analysis and a foreign project', async () => {
    const pending = await Analysis.request({ project, userId: owner._id });

    const notCompleted = await request(application)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: String(project._id), analysisId: String(pending._id) });
    expect(notCompleted.status).toBe(409);

    const strangerProject = await Project.createFor({
      ownerId: (await User.findOne({ email: OTHER.email }))!._id,
      name: 'other proj',
      description: 'd',
    });

    const foreign = await request(application)
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ projectId: String(strangerProject._id), analysisId: String(analysis._id) });
    expect(foreign.status).toBe(404);
  });

  it('rejects a draft only with a reason', async () => {
    const plan = await seededPlan();

    const missingReason = await request(application)
      .post(`/api/v1/plans/${plan.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missingReason.status).toBe(400);

    const rejected = await request(application)
      .post(`/api/v1/plans/${plan.id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'needs an ingress host' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.status).toBe('REJECTED');
    expect(rejected.body.data.review.reason).toBe('needs an ingress host');
  });

  it('walks the deployment board: list, cancel, and the n8n lifecycle', async () => {
    const plan = await seededPlan();
    await request(application)
      .post(`/api/v1/plans/${plan.id}/approve`)
      .set('Authorization', `Bearer ${token}`);
    const created = await request(application)
      .post(`/api/v1/plans/${plan.id}/deployments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ environment: 'STAGING' });
    const deploymentId = created.body.data.id as string;

    const list = await request(application)
      .get('/api/v1/deployments')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data[0]).toMatchObject({ id: deploymentId, status: 'PENDING' });

    const started = await request(application)
      .post(`/api/v1/internal/deployments/${deploymentId}/start`)
      .set(secretHeaders);
    expect(started.status).toBe(200);
    expect(started.body.data.status).toBe('IN_PROGRESS');

    const withoutSecret = await request(application).post(
      `/api/v1/internal/deployments/${deploymentId}/start`,
    );
    expect(withoutSecret.status).toBe(401);

    const synced = await request(application)
      .post(`/api/v1/internal/deployments/${deploymentId}/argo-status`)
      .set(secretHeaders)
      .send({ applicationName: 'pipe-proj', syncStatus: 'SYNCED', healthStatus: 'HEALTHY' });
    expect(synced.body.data.argo).toMatchObject({ syncStatus: 'SYNCED' });

    const cancel = await request(application)
      .post(`/api/v1/deployments/${deploymentId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('CANCELLED');

    const reCancel = await request(application)
      .post(`/api/v1/deployments/${deploymentId}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(reCancel.status).toBe(409);
  });
});
