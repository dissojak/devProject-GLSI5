// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ connected: false }));

const REPOSITORIES = [
  {
    id: 1,
    owner: "octocat",
    name: "secret-app",
    fullName: "octocat/secret-app",
    private: true,
    url: "https://github.com/octocat/secret-app",
    description: "Private movie app",
    defaultBranch: "develop",
    updatedAt: null,
  },
  {
    id: 2,
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    private: false,
    url: "https://github.com/octocat/hello-world",
    description: null,
    defaultBranch: "main",
    updatedAt: null,
  },
];

vi.mock("@/hooks/use-github-connection", () => ({
  useGetGithubConnectionQuery: () => ({
    isLoading: false,
    data: {
      data: {
        connected: state.connected,
        login: state.connected ? "octocat" : null,
        scopes: state.connected ? ["repo"] : [],
        privateRepositories: state.connected,
      },
    },
    refetch: vi.fn(),
  }),
  useListGithubRepositoriesQuery: () => ({
    isLoading: false,
    isError: false,
    isSuccess: state.connected,
    data: state.connected ? { data: REPOSITORIES } : undefined,
  }),
  useStartGithubConnectionMutation: () => [vi.fn(), { isLoading: false }],
  useDisconnectGithubMutation: () => [vi.fn(), { isLoading: false }],
}));

import { GithubRepositoryPicker } from "@/components/dashboard/github-repository-picker";

afterEach(cleanup);

describe("GitHub repository picker", () => {
  it("asks to connect GitHub when the account is not linked", () => {
    state.connected = false;
    render(<GithubRepositoryPicker selectedUrl="" disabled={false} onPick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Connect GitHub/ })).toBeTruthy();
    expect(screen.getByText(/private ones included/)).toBeTruthy();
  });

  it("lists public and private repositories and picks one", () => {
    state.connected = true;
    const onPick = vi.fn();
    render(<GithubRepositoryPicker selectedUrl="" disabled={false} onPick={onPick} />);

    expect(screen.getByText("@octocat")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /octocat\/secret-app/ }));
    expect(onPick).toHaveBeenCalledWith(REPOSITORIES[0]);
  });

  it("filters by search and marks the selected repository", () => {
    state.connected = true;
    render(
      <GithubRepositoryPicker
        selectedUrl="https://github.com/octocat/hello-world.git"
        disabled={false}
        onPick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /octocat\/hello-world/ }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.change(screen.getByRole("searchbox", { name: "Search repositories" }), {
      target: { value: "movie" },
    });
    expect(screen.queryByRole("button", { name: /hello-world/ })).toBeNull();
    expect(screen.getByRole("button", { name: /secret-app/ })).toBeTruthy();
  });
});
