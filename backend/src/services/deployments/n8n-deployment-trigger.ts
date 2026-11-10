import { InvariantViolationError } from '../../domain/errors/index.js';
import { INTERNAL_SECRET_HEADER } from '../../shared/security/internal-auth.js';

const TRIGGER_TIMEOUT_MS = 10_000;

export interface DeploymentTriggerPayload {
  deploymentId: string;
  planId: string;
  gitops: {
    repositoryUrl: string;
    branch: string;
    path: string;
  };
}

export function createN8nDeploymentTrigger(webhookUrl: string, sharedSecret: string) {
  async function trigger(payload: DeploymentTriggerPayload): Promise<void> {
    // The deployment webhook is optional: without it, the deployment record is
    // still created and only the outbound n8n notification is skipped.
    if (webhookUrl.length === 0) {
      return;
    }

    let response: Response;

    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_SECRET_HEADER]: sharedSecret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
      });
    } catch {
      throw new InvariantViolationError('Deployment workflow is unreachable, try again later');
    }

    if (!response.ok) {
      throw new InvariantViolationError(
        `Deployment workflow rejected the request (${response.status})`,
        { status: response.status },
      );
    }
  }

  return { trigger };
}

export type DeploymentTrigger = ReturnType<typeof createN8nDeploymentTrigger>;
