import { vi } from "vitest";

export const disconnectedGithubHooks = {
  useGetGithubConnectionQuery: () => ({
    isLoading: false,
    data: { message: "ok", data: { connected: false, login: null, scopes: [], privateRepositories: false } },
    refetch: vi.fn(),
  }),
  useListGithubRepositoriesQuery: () => ({ isLoading: false, isError: false, isSuccess: false, data: undefined }),
  useStartGithubConnectionMutation: () => [vi.fn(), { isLoading: false }],
  useDisconnectGithubMutation: () => [vi.fn(), { isLoading: false }],
};
