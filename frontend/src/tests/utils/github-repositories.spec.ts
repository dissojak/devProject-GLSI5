import { describe, expect, it } from "vitest";
import { filterGithubRepositories, sameRepositoryUrl } from "@/utils/github-repositories";
import type { GithubRepositorySummary } from "@/types/github";

function repo(fullName: string, description: string | null = null): GithubRepositorySummary {
  const [owner, name] = fullName.split("/");
  return {
    id: fullName.length,
    owner,
    name,
    fullName,
    private: false,
    url: `https://github.com/${fullName}`,
    description,
    defaultBranch: "main",
    updatedAt: null,
  };
}

describe("github repositories", () => {
  it("matches repository URLs regardless of case, .git or trailing slash", () => {
    expect(sameRepositoryUrl("https://github.com/Acme/App", "https://github.com/acme/app.git")).toBe(true);
    expect(sameRepositoryUrl("https://github.com/acme/app", "https://github.com/acme/app/")).toBe(true);
    expect(sameRepositoryUrl("https://github.com/acme/app", "https://github.com/acme/other")).toBe(false);
    expect(sameRepositoryUrl("https://github.com/acme/app", "")).toBe(false);
  });

  it("filters by name and description", () => {
    const list = [repo("acme/web", "Movie frontend"), repo("acme/api"), repo("me/notes")];
    expect(filterGithubRepositories(list, "MOVIE").map((r) => r.fullName)).toEqual(["acme/web"]);
    expect(filterGithubRepositories(list, "acme/").map((r) => r.fullName)).toEqual(["acme/web", "acme/api"]);
    expect(filterGithubRepositories(list, "  ")).toHaveLength(3);
  });
});
