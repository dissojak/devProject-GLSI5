
import {
  KubernetesDeploymentAttempt,
  type KubernetesDeploymentAttemptFields,
  type KubernetesDeploymentAttemptMethods,
} from '../models/entities/kubernetes-deployment-attempt.model.js';

import {
  BaseRepository,
} from './base.repository.js';

export class KubernetesDeploymentAttemptRepository
  extends BaseRepository<
    KubernetesDeploymentAttemptFields,
    KubernetesDeploymentAttemptMethods
  > {
  constructor() {
    super(KubernetesDeploymentAttempt);
  }

  listByPlan(
    projectId: string,
    planId: string,
    page: number,
    limit: number,
  ) {
    return this.paginate(
      {
        project: projectId,
        plan: planId,
      },
      {
        page,
        limit,
        sort: { createdAt: -1 },
      },
    );
  }
}
