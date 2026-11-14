export interface GithubConnectionStatus {
  connected: boolean;
  login: string | null;
  scopes: string[];
  privateRepositories: boolean;
}

export interface GithubRepositorySummary {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description: string | null;
  defaultBranch: string;
  updatedAt: string | null;
}

export interface GithubConnectionResponse {
  message: string;
  data: GithubConnectionStatus;
}

export interface GithubConnectionStartResponse {
  message: string;
  data: { url: string };
}

export interface GithubRepositoryListResponse {
  message: string;
  data: GithubRepositorySummary[];
}
