
import {
  Schema,
  default as mongoose,
  type HydratedDocument,
  type Types,
} from 'mongoose';

import {
  defineStateMachine,
} from '../../domain/state-machine/define-state-machine.js';

import {
  baseSchemaOptions,
} from '../plugins/base-schema-options.js';

export const KUBERNETES_ATTEMPT_STATUSES = [
  'STARTED',
  'APPLIED',
  'FAILED',
] as const;

export type KubernetesAttemptStatus =
  (typeof KUBERNETES_ATTEMPT_STATUSES)[number];

export interface KubernetesDeploymentAttemptFields {
  project: Types.ObjectId;
  plan: Types.ObjectId;
  planVersion: number;
  triggeredBy: Types.ObjectId;
  cluster: string;
  namespace: string;
  status: KubernetesAttemptStatus;
  output?: string;
  errorMessage?: string;
  startedAt: Date;
  finishedAt?: Date;
}

export interface KubernetesDeploymentAttemptMethods {
  markApplied(
    output: string,
  ): Promise<KubernetesDeploymentAttemptDocument>;

  markFailed(
    message: string,
  ): Promise<KubernetesDeploymentAttemptDocument>;
}

export type KubernetesDeploymentAttemptDocument =
  HydratedDocument<
    KubernetesDeploymentAttemptFields,
    KubernetesDeploymentAttemptMethods
  >;

const MACHINE = defineStateMachine<KubernetesAttemptStatus>({
  STARTED: ['APPLIED', 'FAILED'],
  APPLIED: [],
  FAILED: [],
});

const schema = new Schema<
  KubernetesDeploymentAttemptFields,
  mongoose.Model<
    KubernetesDeploymentAttemptFields,
    object,
    KubernetesDeploymentAttemptMethods
  >,
  KubernetesDeploymentAttemptMethods
>(
  {
    project: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Project',
    },
    plan: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'DeploymentPlan',
    },
    planVersion: {
      type: Number,
      required: true,
      min: 1,
    },
    triggeredBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    cluster: {
      type: String,
      required: true,
      trim: true,
    },
    namespace: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: KUBERNETES_ATTEMPT_STATUSES,
      default: 'STARTED',
    },
    output: {
      type: String,
      maxlength: 4000,
    },
    errorMessage: {
      type: String,
      maxlength: 2000,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
    },
  },
  baseSchemaOptions(),
);

schema.index({
  project: 1,
  plan: 1,
  createdAt: -1,
});

schema.methods.markApplied =
  async function markApplied(
    this: KubernetesDeploymentAttemptDocument,
    output: string,
  ): Promise<KubernetesDeploymentAttemptDocument> {
    MACHINE.assertTransition(this.status, 'APPLIED');

    this.set({
      status: 'APPLIED',
      output: output.slice(0, 4000),
      errorMessage: undefined,
      finishedAt: new Date(),
    });

    return this.save() as Promise<
      KubernetesDeploymentAttemptDocument
    >;
  };

schema.methods.markFailed =
  async function markFailed(
    this: KubernetesDeploymentAttemptDocument,
    message: string,
  ): Promise<KubernetesDeploymentAttemptDocument> {
    MACHINE.assertTransition(this.status, 'FAILED');

    this.set({
      status: 'FAILED',
      errorMessage: message.slice(0, 2000),
      finishedAt: new Date(),
    });

    return this.save() as Promise<
      KubernetesDeploymentAttemptDocument
    >;
  };

export const KUBERNETES_DEPLOYMENT_ATTEMPT_MODEL_NAME =
  'KubernetesDeploymentAttempt' as const;

export const KubernetesDeploymentAttempt =
  mongoose.model<
    KubernetesDeploymentAttemptFields,
    mongoose.Model<
      KubernetesDeploymentAttemptFields,
      object,
      KubernetesDeploymentAttemptMethods
    >
  >(
    KUBERNETES_DEPLOYMENT_ATTEMPT_MODEL_NAME,
    schema,
  );
