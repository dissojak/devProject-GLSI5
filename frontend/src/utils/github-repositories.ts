import type { GithubRepositorySummary } from "@/types/github";

function normalizeRepositoryUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\.git$/, "").replace(/\/+$/, "");
}

export function sameRepositoryUrl(a: string, b: string): boolean {
  return b.trim() !== "" && normalizeRepositoryUrl(a) === normalizeRepositoryUrl(b);
}

export function filterGithubRepositories(
  repositories: readonly GithubRepositorySummary[],
  search: string,
): GithubRepositorySummary[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return [...repositories];
  return repositories.filter((repository) =>
    `${repository.fullName} ${repository.description ?? ""}`.toLowerCase().includes(needle),
  );
}
