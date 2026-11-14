
import type {
  KubernetesDeploymentHistoryService,
} from './kubernetes-deployment-history.service.js';

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 2000);
  }

  return 'Kubernetes deployment failed';
}

export function createRecordedKubernetesDeploymentService<
  TResult extends { output: string },
>(
  deployment: {
    deploy(
      userId: string,
      projectId: string,
      planId: string,
    ): Promise<TResult>;
  },
  history: KubernetesDeploymentHistoryService,
) {
  async function deploy(
    userId: string,
    projectId: string,
    planId: string,
  ): Promise<TResult> {
    const attempt = await history.begin(
      userId,
      projectId,
      planId,
    );

    let result: TResult;

    try {
      result = await deployment.deploy(
        userId,
        projectId,
        planId,
      );
    } catch (error) {
      await history.markFailed(
        String(attempt._id),
        describeError(error),
      );

      throw error;
    }

    await history.markApplied(
      String(attempt._id),
      result.output,
    );

    return result;
  }

  return {
    deploy,
  };
}

export type RecordedKubernetesDeploymentService =
  ReturnType<
    typeof createRecordedKubernetesDeploymentService
  >;
