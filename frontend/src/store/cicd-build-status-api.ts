
import {
  apiSlice,
} from "@/store/api";

interface BuildParams {
  projectId: string;
  planId: string;
}

export interface BuildRunStep {
  number: number;
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BuildLogLine {
  text: string;
  error: boolean;
}

export interface BuildRunJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  startedAt: string | null;
  completedAt: string | null;
  errorExcerpt?: BuildLogLine[];
  steps: BuildRunStep[];
}

export interface BuildRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  event: string;
  branch: string | null;
  commit: string;
  createdAt: string;
  updatedAt: string;
  jobs?: BuildRunJob[];
}

export interface BuildStatus {
  workflowPath: string;
  workflowInstalled: boolean;
  workflowMatchesPlan: boolean;
  status:
    | "NOT_INSTALLED"
    | "OUTDATED"
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SUCCESS"
    | "FAILURE";
  run: BuildRun | null;
}

interface BuildStatusResponse {
  message: string;
  data: BuildStatus;
}

interface BuildRequestResponse {
  message: string;
  data: {
    accepted: boolean;
    message: string;
  };
}

export const cicdBuildStatusApi =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getCicdBuildStatus: builder.query<
        BuildStatusResponse,
        BuildParams
      >({
        query: ({ projectId, planId }) =>
          `/projects/${projectId}/plans/${planId}/cicd/build-status`,
      }),

      requestCicdBuild: builder.mutation<
        BuildRequestResponse,
        BuildParams
      >({
        query: ({ projectId, planId }) => ({
          url:
            `/projects/${projectId}/plans/${planId}/cicd/build`,
          method: "POST",
        }),
      }),
    }),
  });

export const {
  useGetCicdBuildStatusQuery,
  useRequestCicdBuildMutation,
} = cicdBuildStatusApi;
