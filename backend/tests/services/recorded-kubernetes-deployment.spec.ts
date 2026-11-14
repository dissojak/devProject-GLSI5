
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createRecordedKubernetesDeploymentService,
} from '../../src/services/kubernetes-deployment-history/recorded-kubernetes-deployment.service.js';

import type {
  KubernetesDeploymentHistoryService,
} from '../../src/services/kubernetes-deployment-history/kubernetes-deployment-history.service.js';

function fixture() {
  const begin = vi.fn().mockResolvedValue({
    _id: 'attempt-1',
  });

  const markApplied = vi.fn().mockResolvedValue({});
  const markFailed = vi.fn().mockResolvedValue({});

  const history = {
    begin,
    markApplied,
    markFailed,
  } as unknown as KubernetesDeploymentHistoryService;

  return {
    begin,
    markApplied,
    markFailed,
    history,
  };
}

describe('Recorded Kubernetes deployment', () => {
  it('records a successful apply', async () => {
    const records = fixture();

    const deployment = {
      deploy: vi.fn().mockResolvedValue({
        status: 'APPLIED',
        output: 'deployment.apps/example created',
      }),
    };

    const service =
      createRecordedKubernetesDeploymentService(
        deployment,
        records.history,
      );

    const result = await service.deploy(
      'user-1',
      'project-1',
      'plan-1',
    );

    expect(result.status).toBe('APPLIED');

    expect(records.begin).toHaveBeenCalledWith(
      'user-1',
      'project-1',
      'plan-1',
    );

    expect(records.markApplied).toHaveBeenCalledWith(
      'attempt-1',
      'deployment.apps/example created',
    );

    expect(records.markFailed).not.toHaveBeenCalled();
  });

  it('records a failed deployment', async () => {
    const records = fixture();

    const deployment = {
      deploy: vi.fn().mockRejectedValue(
        new Error('ImagePull failure'),
      ),
    };

    const service =
      createRecordedKubernetesDeploymentService(
        deployment,
        records.history,
      );

    await expect(
      service.deploy(
        'user-1',
        'project-1',
        'plan-1',
      ),
    ).rejects.toThrow('ImagePull failure');

    expect(records.markFailed).toHaveBeenCalledWith(
      'attempt-1',
      'ImagePull failure',
    );

    expect(records.markApplied).not.toHaveBeenCalled();
  });

  it('does not deploy when creating history fails', async () => {
    const records = fixture();

    records.begin.mockRejectedValue(
      new Error('MongoDB unavailable'),
    );

    const deployment = {
      deploy: vi.fn(),
    };

    const service =
      createRecordedKubernetesDeploymentService(
        deployment,
        records.history,
      );

    await expect(
      service.deploy(
        'user-1',
        'project-1',
        'plan-1',
      ),
    ).rejects.toThrow('MongoDB unavailable');

    expect(deployment.deploy).not.toHaveBeenCalled();
  });
});
