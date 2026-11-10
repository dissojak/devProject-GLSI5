// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { Provider } from "react-redux";
import React from "react";
import { vi } from "vitest";
import { ToastProvider } from "@/components/toast/toast-provider";
import { appStore } from "@/store/store";
import { apiSlice } from "@/store/api";
import { sessionStarted } from "@/store/auth-session";
import { stubMotionEnvironment } from "@/tests/motion-stubs";
import type { Analysis } from "@/types/analysis";
import type { Deployment } from "@/types/deployment";
import type { DeploymentPlan } from "@/types/plan";
import type { Project } from "@/types/project";

export const SESSION_USER = {
  id: "usr_1",
  name: "Pipeliner",
  email: "pipe@example.com",
  role: "DEVELOPER",
  avatarUrl: null,
  lastLoginAt: "2026-11-10T10:00:00.000Z",
};

export const PROJECT_ROW: Project = {
  id: "prj_1",
  owner: "usr_1",
  name: "Atlas",
  description: null,
  environment: "PRODUCTION",
  repository: null,
  createdAt: "2026-11-09T10:00:00.000Z",
  updatedAt: "2026-11-09T10:00:00.000Z",
};

export const ANALYSIS_ROW: Analysis = {
  id: "ana_1",
  project: "prj_1",
  requestedBy: "usr_1",
  number: 7,
  status: "COMPLETED",
  branch: "main",
  detectedFiles: ["src/index.ts"],
  technologies: [
    { name: "React", version: "18", category: "FRAMEWORK", sourceFile: null },
    { name: "Express", version: "4", category: "FRAMEWORK", sourceFile: null },
    { name: "Postgres", version: "16", category: "DATABASE", sourceFile: null },
    { name: "Redis", version: "7", category: "DATABASE", sourceFile: null },
  ],
  components: [],
  docker: { hasDockerfile: true, hasCompose: false, findings: [] },
  error: null,
  startedAt: "2026-11-10T09:00:00.000Z",
  finishedAt: "2026-11-10T09:01:30.000Z",
  durationMs: 90_000,
  createdAt: "2026-11-10T09:00:00.000Z",
  updatedAt: "2026-11-10T09:01:30.000Z",
};

export const PLAN_COMPONENT = {
  name: "api",
  type: "BACKEND",
  containerPort: 3000,
  image: null,
  replicas: 2,
  resources: {
    requests: { cpu: "100m", memory: "128Mi" },
    limits: { cpu: "500m", memory: "512Mi" },
  },
  hpa: { enabled: true, minReplicas: 2, maxReplicas: 6, targetCpuUtilizationPercent: 70 },
  ingress: { enabled: true, host: "api.atlas.dev", path: "/", tls: true },
} as const;

export function planOf(status: DeploymentPlan["status"], overrides = {}): DeploymentPlan {
  return {
    id: "pln_1",
    project: "prj_1",
    analysis: "ana_1",
    version: 2,
    previousPlan: "pln_0",
    status,
    components: [{ ...PLAN_COMPONENT }],
    recommendations: [],
    createdBy: "usr_1",
    review:
      status === "APPROVED"
        ? { decidedBy: "usr_1", decidedAt: "2026-11-10T11:00:00.000Z", reason: null }
        : null,
    createdAt: "2026-11-10T10:00:00.000Z",
    updatedAt: "2026-11-10T10:00:00.000Z",
    ...overrides,
  };
}

export function deploymentOf(status: Deployment["status"], overrides = {}): Deployment {
  return {
    id: "dep_1",
    project: "prj_1",
    plan: "pln_1",
    planVersion: 2,
    environment: "PRODUCTION",
    triggeredBy: "usr_1",
    status,
    gitops: {
      repositoryUrl: "https://github.com/acme/atlas",
      branch: "main",
      path: "k8s",
      commitSha: null,
    },
    argo: {
      applicationName: null,
      syncStatus: null,
      healthStatus: null,
      lastSyncedAt: null,
    },
    error: null,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    createdAt: "2026-11-10T12:00:00.000Z",
    updatedAt: "2026-11-10T12:00:00.000Z",
    ...overrides,
  };
}

type StubHandler = {
  match: (method: "GET" | "POST", path: string) => boolean;
  payload: () => unknown;
  status: number;
};

/** RTKQ wires a Request object + clones the response before reading `text()`. */
function json(status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  const response = {
    ok: status < 400,
    status,
    json: () => Promise.resolve(payload),
    text: () => Promise.resolve(body),
  };
  return { ...response, clone: () => json(status, payload) };
}

function asRequest(input: unknown, init?: RequestInit): { url: string; method: string } {
  if (input instanceof Request) {
    return { url: input.url, method: input.method.toUpperCase() };
  }
  return { url: String(input), method: ((init?.method as string) ?? "GET").toUpperCase() };
}

export function stubPipelineEndpoints(handlers: StubHandler[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((input: unknown, init?: RequestInit) => {
    const request = asRequest(input, init);
    const path = request.url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
    const handler = handlers.find((entry) => entry.match(request.method as "GET" | "POST", path));
    if (!handler) return json(200, { message: "ok", data: null });
    return json(handler.status, handler.payload());
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Board pages + the projects name-join cache the boards all rely on. */
export function listHandler(
  path: "analyses" | "plans" | "deployments" | "projects",
  rows: unknown[],
  pagination = { page: 1, limit: 50, total: rows.length, pageCount: 1 },
): StubHandler {
  return {
    match: (method, reqPath) => method === "GET" && reqPath.endsWith(`/${path}`),
    payload: () => ({
      message: "ok",
      data: rows,
      pagination: path === "projects" ? { ...pagination, limit: 100 } : pagination,
    }),
    status: 200,
  };
}

/** RTKQ hands fetch a single Request object; normalize every call for asserts. */
export function callsOf(fetchMock: ReturnType<typeof vi.fn>): {
  url: string;
  method: string;
  path: string;
  index: number;
}[] {
  return fetchMock.mock.calls.map(([input], index) => {
    const request = input instanceof Request ? input : new Request(String(input));
    const url = request.url;
    return {
      url,
      method: request.method.toUpperCase(),
      path: url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, ""),
      index,
    };
  });
}

export function renderBoard(node: React.ReactNode) {
  return render(
    <Provider store={appStore}>
      <ToastProvider>{node}</ToastProvider>
    </Provider>,
  );
}

export function resetBoardEnvironment() {
  appStore.dispatch(apiSlice.util.resetApiState());
  stubMotionEnvironment();
  vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
  cleanup();
}

export function grantSession() {
  appStore.dispatch(
    sessionStarted({ accessToken: "token-1", user: SESSION_USER }),
  );
}
